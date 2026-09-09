import { getDb } from "~~/services/db/client";
import type { EvidenceReport } from "~~/services/policy/types";

export function recordEvidence(claimId: string, paymentId: string, report: EvidenceReport): number {
  const result = getDb()
    .prepare(
      `INSERT INTO evidence (
        claim_id, payment_id, depeg_verified, lowest_observed_price_usd_micros,
        below_threshold_duration_minutes, liquidity_change_bps, sell_volume_multiple_bps,
        evidence_json, graph_provenance_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      claimId,
      paymentId,
      report.depegVerified ? 1 : 0,
      report.lowestObservedPriceUsdMicros,
      report.belowThresholdDurationMinutes,
      report.liquidityChangeBps,
      report.sellVolumeMultipleBps ?? null,
      JSON.stringify(report.evidence),
      JSON.stringify(report.provenance),
    );
  return Number(result.lastInsertRowid);
}

export function recordSettledPayment(input: {
  paymentId: string;
  claimId: string;
  amountTinybar: string;
  transactionId?: string;
  payer?: string;
  paymentRequired?: unknown;
}): void {
  getDb()
    .prepare(
      `INSERT INTO payments (
        payment_id, claim_id, amount_tinybar, status, payment_required_json,
        transaction_id, facilitator_reference, settled_at
      ) VALUES (?, ?, ?, 'SETTLED', ?, ?, ?, datetime('now'))`,
    )
    .run(
      input.paymentId,
      input.claimId,
      input.amountTinybar,
      input.paymentRequired ? JSON.stringify(input.paymentRequired) : null,
      input.transactionId ?? null,
      input.payer ?? null,
    );
}

