import { readFileSync } from "fs";
import { join } from "path";
import { upsertObservation } from "~~/services/observations/repository";
import { getPolicy } from "~~/services/policy/repository";
import type { MarketObservation } from "~~/services/policy/types";

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

async function createDepegScenario() {
  console.log("=== Creating Depeg Scenario ===\n");

  const policy = getPolicy("test-policy-usdc-1");
  if (!policy) {
    console.error("✗ Policy not found");
    process.exit(1);
  }

  console.log(`Policy: ${policy.policyId}`);
  console.log(`Threshold: $${(policy.thresholdBps / 10000).toFixed(2)} (${policy.thresholdBps} bps)`);
  console.log(`Min duration: ${policy.minimumDurationMinutes} minutes\n`);

  // Create 35 minutes of observations below threshold
  const now = Math.floor(Date.now() / 1000);
  const observations: MarketObservation[] = [];

  // Simulate depeg: prices from $0.95 to $0.97 (all below $0.98 threshold)
  const depegDuration = 35; // minutes
  const depegPrice = 0.97; // USD

  console.log(`Creating ${depegDuration} observations at $${depegPrice.toFixed(2)} (below threshold)...\n`);

  for (let i = 0; i < depegDuration; i++) {
    const observedAt = now - (depegDuration - i) * 60; // 60 seconds apart

    const observation: MarketObservation = {
      policyId: policy.policyId,
      observedAt,
      priceUsdMicros: Math.round(depegPrice * 1_000_000), // $0.97
      liquidityUsdMicros: 400_000_000_000_000, // $400M
      volumeUsdMicros: 1_000_000_000_000, // $1M
      sourceBlock: 25941400 + i,
      sourceTimestamp: observedAt,
      dataComplete: true,
      sourceName: "historical-replay",
    };

    upsertObservation(observation);
    observations.push(observation);

    if ((i + 1) % 10 === 0) {
      console.log(`  Created ${i + 1}/${depegDuration} observations`);
    }
  }

  console.log(`\n✓ Created ${observations.length} observations`);
  console.log(`  Price: $${depegPrice.toFixed(2)} (below $${(policy.thresholdBps / 10000).toFixed(2)} threshold)`);
  console.log(`  Duration: ${depegDuration} minutes`);
  console.log(`  Time range: ${new Date(observations[0].observedAt * 1000).toISOString()}`);
  console.log(`           to ${new Date(observations[observations.length - 1].observedAt * 1000).toISOString()}`);

  console.log("\n=== Depeg Scenario Created ===");
  console.log("\nNext step: Run the detector to find this claim:");
  console.log("  yarn tsx scripts/detect-replay-claim.ts");
}

createDepegScenario().catch(error => {
  console.error("Failed to create depeg scenario:", error);
  process.exit(1);
});
