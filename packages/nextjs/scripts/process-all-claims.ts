/**
 * Process All Claims with AI Agent
 *
 * Runs the AI Claims Agent on all claims that have evidence ready.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { runClaimsAgent } from "~~/services/claims/agent";
import { getDb } from "~~/services/db/client";

// Load .env file
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

async function processAllClaims() {
  console.log("=== Processing All Claims with AI Agent ===\n");

  const db = getDb();

  // Get all claims with evidence
  const claims = db
    .prepare(
      `SELECT DISTINCT c.claim_id, c.policy_id, c.status, p.policyholder
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       JOIN evidence e ON c.claim_id = e.claim_id
       WHERE c.status IN ('POTENTIAL_CLAIM', 'INVESTIGATING', 'EVIDENCE_READY')
       ORDER BY c.created_at DESC`,
    )
    .all() as any[];

  console.log(`Found ${claims.length} claims with evidence\n`);

  let successCount = 0;
  let failCount = 0;

  for (const claim of claims) {
    console.log(`--- Processing Claim: ${claim.claim_id} ---`);
    console.log(`Policy: ${claim.policyholder}`);
    console.log(`Status: ${claim.status}`);

    try {
      const result = await runClaimsAgent({
        policyId: claim.policy_id,
        claimId: claim.claim_id, // Use existing claim ID
      });

      console.log(`  Agent Action: ${result.action}`);
      console.log(`  Rationale: ${result.rationale}`);
      console.log(`  Claim ID: ${result.claimId}`);
      console.log("✓ Claim processed successfully\n");

      successCount++;
    } catch (error: any) {
      console.log(`✗ Failed to process claim: ${error.message}\n`);
      failCount++;
    }
  }

  console.log("=== Processing Complete ===");
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

processAllClaims().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
