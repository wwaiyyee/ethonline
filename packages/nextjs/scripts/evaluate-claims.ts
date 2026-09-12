import { getDb } from "../services/db/client";
import { evaluateEvidence } from "../services/policy/engine";
import type { EvidenceReport, PolicyTerms } from "../services/policy/types";

interface StoredEvidence {
  evidence_id: number;
  claim_id: string;
  evidence_json: string;
  policy_id: string;
}

function adaptEvidence(evidenceJson: string): EvidenceReport {
  const evidence = JSON.parse(evidenceJson);

  return {
    depegVerified: evidence.verdict?.meetsThreshold ?? false,
    durationMinutes: evidence.triggerWindow?.durationMinutes ?? 0,
    provenance: {
      endpoint: "https://gateway.thegraph.com/api",
      latestBlock: evidence.statistics?.observationCount > 0 ? 12345678 : undefined,
    },
    liquidityChangeBps: 0, // Not tracked yet
  };
}

function getPolicy(db: any, policyId: string): PolicyTerms {
  const row = db.prepare(`SELECT * FROM policies WHERE policy_id = ?`).get(policyId);

  return {
    policyId: row.policy_id,
    policyholder: row.policyholder,
    stablecoinAddress: row.stablecoin_address,
    stablecoinSymbol: row.stablecoin_symbol,
    dataChainId: row.data_chain_id,
    thresholdBps: row.threshold_bps,
    minimumDurationMinutes: row.minimum_duration_minutes,
    coverageStart: row.coverage_start,
    coverageEnd: row.coverage_end,
    payoutAmountBaseUnits: row.payout_amount_base_units,
    payoutTokenSymbol: row.payout_token_symbol,
    maxEvidenceBudgetTinybar: row.max_evidence_budget_tinybar,
    active: row.active === 1,
    resolved: row.resolved === 1,
  };
}

async function evaluateAllClaims() {
  const db = getDb();

  // Get all claims with evidence
  const evidenceRows = db
    .prepare(
      `
    SELECT e.evidence_id, e.claim_id, e.evidence_json, c.status, c.policy_id
    FROM evidence e
    JOIN claims c ON e.claim_id = c.claim_id
    WHERE c.status = 'EVIDENCE_READY'
  `,
    )
    .all() as StoredEvidence[];

  console.log(`Found ${evidenceRows.length} claims with evidence\n`);

  for (const row of evidenceRows) {
    console.log(`Evaluating ${row.claim_id}...`);

    try {
      const policy = getPolicy(db, row.policy_id);
      const evidence = adaptEvidence(row.evidence_json);

      console.log("  Evidence:", JSON.stringify(evidence, null, 2));

      const decision = evaluateEvidence(policy, evidence);
      console.log("  Outcome:", decision.outcome);
      console.log("  Reasons:", decision.reasons);

      // Map outcome to status
      const status =
        decision.outcome === "ELIGIBLE_RECOMMENDATION"
          ? "ELIGIBLE"
          : decision.outcome === "INELIGIBLE"
            ? "INELIGIBLE"
            : "NEEDS_REVIEW";

      // Store decision in claims table
      db.prepare(
        `
        UPDATE claims
        SET
          status = ?,
          agent_action = ?,
          agent_rationale = ?,
          updated_at = datetime('now')
        WHERE claim_id = ?
      `,
      ).run(status, decision.outcome, decision.reasons.join("; "), row.claim_id);

      console.log(`  > Decision stored: ${status}\n`);
    } catch (error) {
      console.error("  X Error:", error);
    }
  }

  // Summary
  const summary = db
    .prepare(
      `
    SELECT status, COUNT(*) as count
    FROM claims
    GROUP BY status
  `,
    )
    .all();

  console.log("Summary:");
  console.log(summary);
}

evaluateAllClaims().catch(console.error);
