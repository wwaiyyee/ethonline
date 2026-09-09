import { readFileSync } from "fs";
import { join } from "path";
import { detectAllCandidates } from "~~/services/claims/detector";
import { listObservations } from "~~/services/observations/repository";
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

async function testDetector() {
  console.log("=== Testing Candidate Detector ===\n");

  const policies = listActivePolicies();
  console.log(`Found ${policies.length} active policies\n`);

  for (const policy of policies) {
    console.log(`Policy: ${policy.policyId}`);
    console.log(`  Threshold: ${policy.thresholdBps / 100}% ($${(policy.thresholdBps / 10000).toFixed(2)})`);
    console.log(`  Min duration: ${policy.minimumDurationMinutes} minutes`);

    // Check observations
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - policy.minimumDurationMinutes * 60;
    const observations = listObservations(policy.policyId, windowStart, now);

    console.log(`  Observations in window: ${observations.length}`);

    if (observations.length > 0) {
      const prices = observations.map(o => o.priceUsdMicros / 1_000_000);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const thresholdUsd = policy.thresholdBps / 10000;
      const belowThreshold = observations.filter(o => o.priceUsdMicros / 1_000_000 < thresholdUsd);

      console.log(`  Price range: $${minPrice.toFixed(6)} - $${maxPrice.toFixed(6)}`);
      console.log(`  Observations below threshold: ${belowThreshold.length}/${observations.length}`);
    }
    console.log();
  }

  console.log("Running detector...\n");
  const candidates = detectAllCandidates(policies);

  if (candidates.length === 0) {
    console.log("✗ No claims detected");
    console.log("\nPossible reasons:");
    console.log("  - Not enough observations (need at least 30)");
    console.log("  - Prices not below threshold ($0.98)");
    console.log("  - Time window has gaps");
    console.log("  - Claim already exists");
  } else {
    console.log(`✓ Detected ${candidates.length} candidate claim(s):\n`);
    candidates.forEach(c => {
      console.log(`  Claim ID: ${c.claimId}`);
      console.log(`  Policy: ${c.policyId}`);
      console.log(`  Window: ${new Date(c.triggerWindowStart * 1000).toISOString()}`);
      console.log(`          to ${new Date(c.triggerWindowEnd * 1000).toISOString()}`);
      console.log(`  Duration: ${((c.triggerWindowEnd - c.triggerWindowStart) / 60).toFixed(1)} minutes`);
      console.log(`  Observations: ${c.observationCount}`);
      console.log();
    });
  }

  console.log("=== Detector Test Complete ===");
}

testDetector().catch(error => {
  console.error("Detector test failed:", error);
  process.exit(1);
});
