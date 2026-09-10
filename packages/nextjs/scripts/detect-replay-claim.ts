import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "~~/services/db/client";
import { listObservations } from "~~/services/observations/repository";
import { getPolicy } from "~~/services/policy/repository";
import type { ClaimStatus, MarketObservation } from "~~/services/policy/types";

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

async function detectFromReplayData() {
  console.log("=== Detecting Claims from Replay Data ===\n");

  const policy = getPolicy("test-policy-usdc-1");
  if (!policy) {
    console.error("✗ Policy not found");
    process.exit(1);
  }

  // Get ALL observations (not just recent)
  const allObservations = listObservations(policy.policyId);
  console.log(`Total observations: ${allObservations.length}`);

  // Filter to replay data only
  const replayObs = allObservations.filter(o => o.sourceName === "historical-replay");
  console.log(`Replay observations: ${replayObs.length}\n`);

  if (replayObs.length === 0) {
    console.log("✗ No replay data found");
    return;
  }

  // Check conditions
  const thresholdMicros = Math.round((policy.thresholdBps / 10_000) * 1_000_000);
  console.log(`Policy threshold: $${(thresholdMicros / 1_000_000).toFixed(2)} (${policy.thresholdBps} bps)`);
  console.log(`Min duration: ${policy.minimumDurationMinutes} minutes\n`);

  // Check 1: Enough observations?
  console.log(`Check 1: Enough observations? ${replayObs.length} >= ${policy.minimumDurationMinutes}`);
  if (replayObs.length < policy.minimumDurationMinutes) {
    console.log("  ✗ Not enough observations");
    return;
  }
  console.log("  ✓ Pass\n");

  // Check 2: All prices below threshold?
  const belowThreshold = replayObs.filter(o => o.priceUsdMicros < thresholdMicros);
  console.log(`Check 2: All prices below threshold? ${belowThreshold.length}/${replayObs.length}`);
  const prices = replayObs.map(o => o.priceUsdMicros / 1_000_000);
  console.log(`  Price range: $${Math.min(...prices).toFixed(6)} - $${Math.max(...prices).toFixed(6)}`);
  if (belowThreshold.length !== replayObs.length) {
    console.log("  ✗ Not all prices below threshold");
    return;
  }
  console.log("  ✓ Pass\n");

  // Check 3: Continuous window?
  function isContinuous(observations: MarketObservation[]): boolean {
    if (observations.length < 2) return true;
    for (let i = 1; i < observations.length; i++) {
      const gap = observations[i].observedAt - observations[i - 1].observedAt;
      if (gap > 90) return false;
    }
    return true;
  }

  const continuous = isContinuous(replayObs);
  console.log(`Check 3: Continuous window (no gaps > 90s)? ${continuous ? "Yes" : "No"}`);
  if (!continuous) {
    console.log("  ✗ Window has gaps");
    return;
  }
  console.log("  ✓ Pass\n");

  // Check 4: No existing claim?
  const existingClaim = getDb()
    .prepare("SELECT claim_id, status FROM claims WHERE policy_id = ?")
    .get(policy.policyId) as { claim_id: string; status: string } | undefined;

  console.log(`Check 4: No existing open claim?`);
  if (existingClaim) {
    console.log(`  ✗ Claim already exists: ${existingClaim.claim_id} (${existingClaim.status})`);
    console.log(`\nExisting claim found. This is expected if you ran the detector before.`);
    console.log(`Claim ID: ${existingClaim.claim_id}`);
    return;
  }
  console.log("  ✓ Pass\n");

  // Create claim
  const now = Math.floor(Date.now() / 1000);
  const claimId = `claim-${policy.policyId}-${now}`;
  const triggerWindowStart = replayObs[0].observedAt;
  const triggerWindowEnd = replayObs[replayObs.length - 1].observedAt;

  getDb()
    .prepare(
      `INSERT INTO claims (
        claim_id, policy_id, status,
        trigger_window_start, trigger_window_end,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    )
    .run(claimId, policy.policyId, "POTENTIAL_CLAIM" satisfies ClaimStatus, triggerWindowStart, triggerWindowEnd);

  console.log("✓✓✓ CLAIM DETECTED ✓✓✓\n");
  console.log(`Claim ID: ${claimId}`);
  console.log(`Policy: ${policy.policyId}`);
  console.log(`Trigger window: ${new Date(triggerWindowStart * 1000).toISOString()}`);
  console.log(`             to ${new Date(triggerWindowEnd * 1000).toISOString()}`);
  console.log(`Duration: ${((triggerWindowEnd - triggerWindowStart) / 60).toFixed(1)} minutes`);
  console.log(`Observations: ${replayObs.length}`);
  console.log(`\nClaim stored in database with status: POTENTIAL_CLAIM`);

  console.log("\n=== Detection Complete ===");
}

detectFromReplayData().catch(error => {
  console.error("Detection failed:", error);
  process.exit(1);
});
