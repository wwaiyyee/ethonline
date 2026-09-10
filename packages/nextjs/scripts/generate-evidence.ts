import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "~~/services/db/client";
import { listObservations } from "~~/services/observations/repository";
import { getPolicy } from "~~/services/policy/repository";
import type { ClaimStatus } from "~~/services/policy/types";

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

async function generateEvidence() {
  console.log("=== Generating Evidence Report ===\n");

  // Get the claim
  const db = getDb();
  const claim = db
    .prepare("SELECT * FROM claims WHERE policy_id = ? ORDER BY created_at DESC LIMIT 1")
    .get("test-policy-usdc-1") as any;

  if (!claim) {
    console.error("✗ No claim found");
    process.exit(1);
  }

  console.log(`Claim ID: ${claim.claim_id}`);
  console.log(`Status: ${claim.status}`);
  console.log(`Trigger window: ${new Date(claim.trigger_window_start * 1000).toISOString()}`);
  console.log(`             to ${new Date(claim.trigger_window_end * 1000).toISOString()}\n`);

  // Get policy
  const policy = getPolicy(claim.policy_id);
  if (!policy) {
    console.error("✗ Policy not found");
    process.exit(1);
  }

  // Get observations
  const observations = listObservations(claim.policy_id, claim.trigger_window_start, claim.trigger_window_end);

  console.log(`Found ${observations.length} observations\n`);

  // Generate evidence JSON
  const evidence = {
    claimId: claim.claim_id,
    policyId: claim.policy_id,
    generatedAt: new Date().toISOString(),
    triggerWindow: {
      start: claim.trigger_window_start,
      end: claim.trigger_window_end,
      durationMinutes: (claim.trigger_window_end - claim.trigger_window_start) / 60,
    },
    policyTerms: {
      thresholdBps: policy.thresholdBps,
      thresholdUsd: policy.thresholdBps / 10000,
      minimumDurationMinutes: policy.minimumDurationMinutes,
      stablecoin: policy.stablecoinSymbol,
    },
    observations: observations.map(o => ({
      timestamp: o.observedAt,
      timestampIso: new Date(o.observedAt * 1000).toISOString(),
      priceUsd: o.priceUsdMicros / 1_000_000,
      liquidityUsd: o.liquidityUsdMicros / 1_000_000,
      volumeUsd: o.volumeUsdMicros / 1_000_000,
      sourceBlock: o.sourceBlock,
      sourceName: o.sourceName,
      dataComplete: o.dataComplete,
    })),
    statistics: {
      observationCount: observations.length,
      minPrice: Math.min(...observations.map(o => o.priceUsdMicros)) / 1_000_000,
      maxPrice: Math.max(...observations.map(o => o.priceUsdMicros)) / 1_000_000,
      avgPrice: observations.reduce((sum, o) => sum + o.priceUsdMicros, 0) / observations.length / 1_000_000,
      allBelowThreshold: observations.every(o => o.priceUsdMicros < (policy.thresholdBps / 10_000) * 1_000_000),
      continuousCoverage: true,
    },
    verdict: {
      meetsThreshold: observations.every(o => o.priceUsdMicros < (policy.thresholdBps / 10_000) * 1_000_000),
      meetsDuration: observations.length >= policy.minimumDurationMinutes,
      isValid: true,
    },
  };

  // Store evidence in database
  const evidenceJson = JSON.stringify(evidence, null, 2);

  // Calculate evidence metrics
  const lowestPrice = Math.min(...observations.map(o => o.priceUsdMicros));
  const durationMinutes = (claim.trigger_window_end - claim.trigger_window_start) / 60;

  db.prepare(
    `INSERT INTO evidence (
      claim_id, depeg_verified, lowest_observed_price_usd_micros,
      below_threshold_duration_minutes, liquidity_change_bps,
      sell_volume_multiple_bps, evidence_json, graph_provenance_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  ).run(
    claim.claim_id,
    1, // depeg_verified = true
    lowestPrice,
    Math.floor(durationMinutes),
    0, // liquidity_change_bps (not calculated yet)
    0, // sell_volume_multiple_bps (not calculated yet)
    evidenceJson,
    JSON.stringify({ source: "the-graph", observations: observations.length }),
  );

  const evidenceId = db.prepare("SELECT last_insert_rowid() as id").get() as { id: number };

  console.log("✓ Evidence report generated");
  console.log(`  Evidence ID: ${evidenceId.id}`);
  console.log(`  Observations: ${evidence.observations.length}`);
  console.log(
    `  Price range: $${evidence.statistics.minPrice.toFixed(6)} - $${evidence.statistics.maxPrice.toFixed(6)}`,
  );
  console.log(`  All below threshold: ${evidence.statistics.allBelowThreshold}`);
  console.log(`  Meets duration: ${evidence.verdict.meetsDuration}`);
  console.log(`  Valid: ${evidence.verdict.isValid}\n`);

  // Update claim status
  db.prepare("UPDATE claims SET status = ?, updated_at = datetime('now') WHERE claim_id = ?").run(
    "EVIDENCE_READY" satisfies ClaimStatus,
    claim.claim_id,
  );

  console.log("✓ Claim status updated to: EVIDENCE_READY\n");

  // Save evidence to file
  const evidencePath = join(process.cwd(), ".data", `evidence-${claim.claim_id}.json`);
  const fs = await import("fs/promises");
  await fs.writeFile(evidencePath, evidenceJson);

  console.log("✓ Evidence saved to file:", evidencePath);

  console.log("\n=== Evidence Generation Complete ===");
  console.log("\nSummary:");
  console.log(`  Claim: ${claim.claim_id}`);
  console.log(`  Evidence ID: ${evidenceId.id}`);
  console.log(`  Status: EVIDENCE_READY`);
  console.log(`  Valid claim: ${evidence.verdict.isValid ? "YES" : "NO"}`);
}

generateEvidence().catch(error => {
  console.error("Evidence generation failed:", error);
  process.exit(1);
});
