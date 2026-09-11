import { getDb } from "~~/services/db/client";
import type { EvidenceReport } from "~~/services/policy/types";

export type EvidenceAuditInput = {
  claimId: string;
  paymentId: string;
  amountTinybar: string;
  paymentRequired: unknown;
  transactionId?: string;
  facilitatorReference?: string;
  report: EvidenceReport;
};

export function recordEvidenceAudit(input: EvidenceAuditInput) {
  const database = getDb();
  const save = database.transaction(() => {
    database
      .prepare(
        `INSERT OR IGNORE INTO claims (claim_id, policy_id, status, trigger_window_start, trigger_window_end) VALUES (?, ?, 'EVIDENCE_READY', ?, ?)`,
      )
      .run(input.claimId, input.claimId, input.report.provenance.fromTimestamp, input.report.provenance.toTimestamp);
    database
      .prepare(
        `INSERT OR REPLACE INTO payments (payment_id, claim_id, amount_tinybar, status, payment_required_json, transaction_id, facilitator_reference, settled_at) VALUES (?, ?, ?, 'SETTLED', ?, ?, ?, datetime('now'))`,
      )
      .run(
        input.paymentId,
        input.claimId,
        input.amountTinybar,
        JSON.stringify(input.paymentRequired),
        input.transactionId ?? null,
        input.facilitatorReference ?? null,
      );
    database
      .prepare(
        `INSERT OR IGNORE INTO evidence (claim_id, payment_id, depeg_verified, lowest_observed_price_usd_micros, below_threshold_duration_minutes, liquidity_change_bps, sell_volume_multiple_bps, evidence_json, graph_provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.claimId,
        input.paymentId,
        input.report.depegVerified ? 1 : 0,
        input.report.lowestObservedPriceUsdMicros,
        input.report.belowThresholdDurationMinutes,
        input.report.liquidityChangeBps,
        input.report.sellVolumeMultipleBps ?? null,
        JSON.stringify(input.report.evidence),
        JSON.stringify(input.report.provenance),
      );
  });
  save();
}
