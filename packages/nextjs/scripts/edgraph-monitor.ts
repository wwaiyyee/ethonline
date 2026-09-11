import { readFileSync } from "fs";
import { join } from "path";
import { runClaimsAgent } from "~~/services/claims/agent";
import { detectAllCandidates } from "~~/services/claims/detector";
import { monitorPolicy } from "~~/services/graph/monitor";
import { listActivePolicies } from "~~/services/policy/repository";

// Load .env file manually
const envPath = join(process.cwd(), ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error: any) {
  console.error("Warning: Could not load .env file:", error.message);
}

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
        if (result.evidence) {
          console.log(`[edgraph-monitor] Evidence purchased! Decision: ${result.evidence.policyDecision.decision}`);
        }
      } catch (error) {
        console.error(`[edgraph-monitor] Claims agent failed for ${candidate.claimId}:`, error);
      }
    }
  } catch (error) {
    console.error(`[edgraph-monitor] Claim detection failed:`, error);
  }
}

async function main() {
  await tick();
  if (process.env.EDGRAPH_MONITOR_ONCE !== "true") {
    setInterval(() => void tick(), intervalMs);
  }
}

main().catch(console.error);
