import { readFileSync } from "fs";
import { join } from "path";
import { runClaimsAgent } from "~~/services/claims/agent";
import { detectAllCandidates } from "~~/services/claims/detector";
import { getDb } from "~~/services/db/client";
import { monitorPolicy } from "~~/services/graph/monitor";
import { listActivePolicies } from "~~/services/policy/repository";

// Load .env files (both root and packages/nextjs)
const envPaths = [join(process.cwd(), ".env"), join(process.cwd(), "packages/nextjs/.env"), join(__dirname, "../.env")];
let loadedCount = 0;
for (const envPath of envPaths) {
  try {
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) return;
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        if (
          key.startsWith("EDGRAPH_") ||
          key.startsWith("GEMINI_") ||
          key.startsWith("ANTHROPIC_") ||
          key.startsWith("AI_") ||
          key.startsWith("X402_")
        ) {
          process.env[key] = value;
          loadedCount++;
        } else if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch {
    // optional path
  }
}
console.log(`[edgraph-monitor] Loaded ${loadedCount} environment variables`);

const intervalMs = Math.max(15_000, Number(process.env.EDGRAPH_MONITOR_INTERVAL_MS ?? 60_000));

async function tick() {
  const policies = listActivePolicies();

  // Step 1: Write observations for all active policies
  for (const policy of policies) {
    try {
      const observation = await monitorPolicy(policy);
      console.log(
        `[edgraph-monitor] LIVE GRAPH DATA policy=${policy.policyId} price=$${(observation.priceUsdMicros / 1_000_000).toFixed(4)} liquidity=$${(observation.liquidityUsdMicros / 1_000_000).toFixed(2)} block=${observation.sourceBlock ?? "unknown"}`,
      );
    } catch (error) {
      console.error(`[edgraph-monitor] policy=${policy.policyId} failed`, error);
    }
  }

  // Step 2: Detect claims based on accumulated observations
  try {
    const candidates = detectAllCandidates(policies);
    if (candidates.length > 0) {
      console.log(`[edgraph-monitor] Detected ${candidates.length} claim candidate(s)`);
    }

    // Step 3: Run claims agent for each new candidate
    for (const candidate of candidates) {
      try {
        console.log(`[edgraph-monitor] Running claims agent for ${candidate.claimId}...`);
        const result = await runClaimsAgent({
          policyId: candidate.policyId,
          claimId: candidate.claimId,
        });
        console.log(`[edgraph-monitor] Claims agent ${result.action} for ${result.claimId}: ${result.rationale}`);
        if (result.policyDecision) {
          console.log(`[edgraph-monitor] Decision: ${result.policyDecision.outcome}`);
        }
      } catch (error) {
        console.error(`[edgraph-monitor] Claims agent failed for ${candidate.claimId}:`, error);
      }
    }
  } catch (error) {
    console.error(`[edgraph-monitor] Claim detection failed:`, error);
  }

  // Step 4: Retry stuck claims that need processing
  try {
    const db = getDb();
    const stuckClaims = db
      .prepare(
        `SELECT c.claim_id, c.policy_id, c.status
         FROM claims c
         JOIN policies p ON c.policy_id = p.policy_id
         WHERE (c.status = 'POTENTIAL_CLAIM' AND c.agent_action IS NULL)
            OR (c.status = 'INVESTIGATING' AND c.policy_decision_json IS NULL)
            OR (c.status = 'EVIDENCE_PENDING' AND NOT EXISTS (
              SELECT 1 FROM evidence e WHERE e.claim_id = c.claim_id
            ))
         LIMIT 10`,
      )
      .all() as Array<{ claim_id: string; policy_id: string; status: string }>;

    if (stuckClaims.length > 0) {
      console.log(`[edgraph-monitor] Found ${stuckClaims.length} stuck claim(s) to retry`);
    }

    for (const claim of stuckClaims) {
      try {
        console.log(`[edgraph-monitor] Retrying stuck claim ${claim.claim_id}...`);
        const result = await runClaimsAgent({
          policyId: claim.policy_id,
          claimId: claim.claim_id,
        });
        console.log(`[edgraph-monitor] Stuck claim processed: ${result.action}`);
        if (result.policyDecision) {
          console.log(`[edgraph-monitor] Decision: ${result.policyDecision.outcome}`);
        }
      } catch (error) {
        console.error(`[edgraph-monitor] Failed to process stuck claim ${claim.claim_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`[edgraph-monitor] Stuck claim retry failed:`, error);
  }
}

async function main() {
  await tick();
  if (process.env.EDGRAPH_MONITOR_ONCE !== "true") {
    setInterval(() => void tick(), intervalMs);
  }
}

main().catch(console.error);
