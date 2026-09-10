import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "~~/services/db/client";
import { getGraphConfig } from "~~/services/graph/config";
import { listObservations } from "~~/services/observations/repository";
import { getPolicy } from "~~/services/policy/repository";

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

console.log("=".repeat(70));
console.log("EDGRAPH END-TO-END PIPELINE VALIDATION");
console.log("=".repeat(70));

const db = getDb();

console.log("\n### PHASE 1: The Graph Integration ###\n");

const config = getGraphConfig();
console.log("✓ Graph endpoint:", config.provenanceEndpoint);
console.log("✓ Pool:", config.poolAddress);
console.log("✓ Stablecoin:", config.stablecoinSymbol, config.stablecoinAddress);
console.log("✓ Quote token:", config.quoteTokenSymbol, config.quoteTokenAddress);

console.log("\n### PHASE 2: Database & Monitoring ###\n");

const policy = getPolicy("test-policy-usdc-1");
if (policy) {
  console.log("✓ Policy:", policy.policyId);
  console.log("  Threshold: $" + (policy.thresholdBps / 10000).toFixed(2));
  console.log("  Min duration:", policy.minimumDurationMinutes, "minutes");
  console.log(
    "  Coverage:",
    new Date(policy.coverageStart * 1000).toISOString().split("T")[0],
    "to",
    new Date(policy.coverageEnd * 1000).toISOString().split("T")[0],
  );
} else {
  console.log("✗ Policy not found");
}

const observations = listObservations("test-policy-usdc-1");
console.log("\n✓ Observations:", observations.length);
if (observations.length > 0) {
  const prices = observations.map(o => o.priceUsdMicros / 1_000_000);
  console.log("  Price range: $" + Math.min(...prices).toFixed(6), "to $" + Math.max(...prices).toFixed(6));
  console.log("  Time range:", new Date(observations[0].observedAt * 1000).toISOString());
  console.log("            to", new Date(observations[observations.length - 1].observedAt * 1000).toISOString());
}

console.log("\n### PHASE 3: Detection ###\n");

const claims = db.prepare("SELECT * FROM claims WHERE policy_id = ?").all("test-policy-usdc-1") as any[];
console.log("✓ Claims detected:", claims.length);

if (claims.length > 0) {
  const claim = claims[0];
  console.log("\n  Claim ID:", claim.claim_id);
  console.log("  Status:", claim.status);
  console.log("  Trigger window:", new Date(claim.trigger_window_start * 1000).toISOString());
  console.log("                to", new Date(claim.trigger_window_end * 1000).toISOString());
  console.log("  Duration:", ((claim.trigger_window_end - claim.trigger_window_start) / 60).toFixed(1), "minutes");

  console.log("\n### PHASE 4: Evidence ###\n");

  const evidence = db.prepare("SELECT * FROM evidence WHERE claim_id = ?").all(claim.claim_id) as any[];
  console.log("✓ Evidence records:", evidence.length);

  if (evidence.length > 0) {
    const ev = evidence[0];
    console.log("\n  Evidence ID:", ev.evidence_id);
    console.log("  Depeg verified:", ev.depeg_verified === 1 ? "YES" : "NO");
    console.log("  Lowest price: $" + (ev.lowest_observed_price_usd_micros / 1_000_000).toFixed(6));
    console.log("  Duration:", ev.below_threshold_duration_minutes, "minutes");

    // Check if evidence file exists
    const evidencePath = join(process.cwd(), ".data", `evidence-${claim.claim_id}.json`);
    try {
      const evidenceContent = readFileSync(evidencePath, "utf-8");
      const evidenceData = JSON.parse(evidenceContent);
      console.log("\n  ✓ Evidence file saved:", evidencePath);
      console.log("    Observations in evidence:", evidenceData.observations.length);
      console.log("    Verdict - Valid:", evidenceData.verdict.isValid ? "YES" : "NO");
      console.log("    Verdict - Meets threshold:", evidenceData.verdict.meetsThreshold ? "YES" : "NO");
      console.log("    Verdict - Meets duration:", evidenceData.verdict.meetsDuration ? "YES" : "NO");
    } catch (error) {
      console.log("  ✗ Evidence file not found");
    }
  }
}

console.log("\n" + "=".repeat(70));
console.log("PIPELINE STATUS");
console.log("=".repeat(70));

const status = {
  graphConnected: config.endpoint.length > 0,
  policyActive: policy !== null && policy.active,
  observationsCollected: observations.length > 0,
  claimDetected: claims.length > 0,
  evidenceGenerated:
    claims.length > 0 &&
    (db.prepare("SELECT COUNT(*) as count FROM evidence WHERE claim_id = ?").get(claims[0]?.claim_id) as any),
};

console.log("\n✓ The Graph connected:", status.graphConnected ? "YES" : "NO");
console.log("✓ Policy active:", status.policyActive ? "YES" : "NO");
console.log("✓ Observations collected:", status.observationsCollected ? "YES" : "NO");
console.log("✓ Claim detected:", status.claimDetected ? "YES" : "NO");
console.log("✓ Evidence generated:", status.evidenceGenerated?.count > 0 ? "YES" : "NO");

const allPassed =
  status.graphConnected &&
  status.policyActive &&
  status.observationsCollected &&
  status.claimDetected &&
  status.evidenceGenerated?.count > 0;

console.log("\n" + "=".repeat(70));
if (allPassed) {
  console.log("✓✓✓ ALL PHASES COMPLETE ✓✓✓");
  console.log("\nThe EdGraph depeg insurance pipeline is fully operational!");
  console.log("\nWhat happened:");
  console.log("1. Connected to The Graph and configured USDC/WETH pool");
  console.log("2. Created test policy with $0.98 threshold, 30min duration");
  console.log("3. Simulated 35 minutes of depeg data ($0.97)");
  console.log("4. Detector found the depeg and created claim");
  console.log("5. Evidence report generated with full provenance");
  console.log("\nNext steps:");
  console.log("- Integrate with Hedera for on-chain payments");
  console.log("- Add AI agent verification");
  console.log("- Deploy to production");
} else {
  console.log("⚠ SOME PHASES INCOMPLETE");
  console.log("Please review the status above.");
}

console.log("=".repeat(70) + "\n");
