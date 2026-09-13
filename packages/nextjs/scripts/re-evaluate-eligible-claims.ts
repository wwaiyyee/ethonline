import { evaluateClaimWithAI } from "../services/ai/claimEvaluation";
import { getDb } from "../services/db/client";
import type { EvidenceReport, PolicyTerms } from "../services/policy/types";

/**
 * Re-evaluate ELIGIBLE claims that don't have policy_decision_json
 * with the NEW AI system to get better reasoning
 */
async function reEvaluateEligibleClaims() {
  const db = getDb();

  // Find ELIGIBLE claims without policy_decision_json
  const claims = db
    .prepare(
      `SELECT c.claim_id, c.policy_id,
              c.lowest_price_usd_micros, c.duration_minutes,
              e.evidence_json
       FROM claims c
       LEFT JOIN evidence e ON c.claim_id = e.claim_id
       WHERE c.status = 'ELIGIBLE'
       AND c.policy_decision_json IS NULL
       AND e.evidence_json IS NOT NULL`,
    )
    .all() as Array<{
    claim_id: string;
    policy_id: string;
    lowest_price_usd_micros: number;
    duration_minutes: number;
    evidence_json: string;
  }>;

  console.log(`Found ${claims.length} ELIGIBLE claims without AI evaluation\n`);

  for (const claim of claims) {
    console.log(`Processing: ${claim.claim_id.substring(0, 50)}`);

    try {
      // Get policy from database
      const policyRow = db.prepare(`SELECT * FROM policies WHERE policy_id = ?`).get(claim.policy_id) as any;
      if (!policyRow) {
        console.log(`  ✗ Policy not found: ${claim.policy_id}`);
        continue;
      }

      const policy: PolicyTerms = {
        policyId: policyRow.policy_id,
        policyholder: policyRow.policyholder,
        dataChainId: policyRow.data_chain_id,
        stablecoinSymbol: policyRow.stablecoin_symbol,
        stablecoinAddress: policyRow.stablecoin_address,
        referencePoolAddress: policyRow.reference_pool_address,
        thresholdBps: policyRow.threshold_bps,
        minimumDurationMinutes: policyRow.minimum_duration_minutes,
        payoutAmountBaseUnits: policyRow.payout_amount_base_units,
        payoutTokenSymbol: policyRow.payout_token_symbol,
        coverageStart: policyRow.coverage_start,
        coverageEnd: policyRow.coverage_end,
        maxEvidenceBudgetTinybar: policyRow.max_evidence_budget_tinybar,
        active: Boolean(policyRow.active),
        resolved: Boolean(policyRow.resolved),
      };

      // Parse evidence
      const evidenceData = JSON.parse(claim.evidence_json);

      // Convert to EvidenceReport format
      const evidence: EvidenceReport = {
        depegVerified: evidenceData.verdict?.meetsThreshold ?? true,
        durationMinutes: claim.duration_minutes,
        lowestObservedPriceUsdMicros: claim.lowest_price_usd_micros,
        provenance: {
          endpoint: "https://gateway.thegraph.com/api",
          latestBlock: evidenceData.statistics?.observationCount > 0 ? 12345678 : undefined,
        },
        liquidityChangeBps: 0,
      };

      console.log(`  Running AI evaluation...`);

      // Run NEW AI evaluation
      const policyDecision = await evaluateClaimWithAI(policy, evidence);

      console.log(`  Outcome: ${policyDecision.outcome}`);
      console.log(`  Reasoning: ${policyDecision.reasoning?.substring(0, 100)}...`);

      // Store in database
      db.prepare(
        `UPDATE claims
         SET policy_decision_json = ?,
             updated_at = datetime('now')
         WHERE claim_id = ?`,
      ).run(JSON.stringify(policyDecision), claim.claim_id);

      console.log(`  ✓ Updated with AI evaluation\n`);
    } catch (error) {
      console.error(`  ✗ Error:`, error);
      console.log("");
    }
  }

  console.log("Done!");
}

reEvaluateEligibleClaims().catch(console.error);
