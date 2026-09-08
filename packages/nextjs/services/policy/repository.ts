import { getDb } from "~~/services/db/client";
import type { PolicyTerms } from "~~/services/policy/types";

type PolicyRow = {
  policy_id: string;
  policyholder: string;
  data_chain_id: string;
  stablecoin_symbol: string;
  stablecoin_address: string;
  reference_pool_address: string;
  threshold_bps: number;
  minimum_duration_minutes: number;
  payout_amount_base_units: string;
  payout_token_symbol: string;
  coverage_start: number;
  coverage_end: number;
  max_evidence_budget_tinybar: string;
  active: number;
  resolved: number;
  resolution_hash: string | null;
  creation_transaction_id: string | null;
};

function rowToPolicy(row: PolicyRow): PolicyTerms {
  return {
    policyId: row.policy_id,
    policyholder: row.policyholder,
    dataChainId: row.data_chain_id,
    stablecoinSymbol: row.stablecoin_symbol,
    stablecoinAddress: row.stablecoin_address as `0x${string}`,
    referencePoolAddress: row.reference_pool_address as `0x${string}`,
    thresholdBps: row.threshold_bps,
    minimumDurationMinutes: row.minimum_duration_minutes,
    payoutAmountBaseUnits: row.payout_amount_base_units,
    payoutTokenSymbol: row.payout_token_symbol,
    coverageStart: row.coverage_start,
    coverageEnd: row.coverage_end,
    maxEvidenceBudgetTinybar: row.max_evidence_budget_tinybar,
    active: row.active === 1,
    resolved: row.resolved === 1,
    resolutionHash: row.resolution_hash ? (row.resolution_hash as `0x${string}`) : undefined,
    creationTransactionId: row.creation_transaction_id ?? undefined,
  };
}

const POLICY_COLUMNS = `
  policy_id, policyholder, data_chain_id, stablecoin_symbol,
  stablecoin_address, reference_pool_address, threshold_bps,
  minimum_duration_minutes, payout_amount_base_units, payout_token_symbol,
  coverage_start, coverage_end, max_evidence_budget_tinybar,
  active, resolved, resolution_hash, creation_transaction_id
`;

/**
 * Mirror policy terms after the Hedera transaction has reached consensus.
 * Hedera remains the source of truth; SQLite is the operational read model.
 */
export function upsertPolicy(policy: PolicyTerms): PolicyTerms {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO policies (
        policy_id, policyholder, data_chain_id, stablecoin_symbol,
        stablecoin_address, reference_pool_address, threshold_bps,
        minimum_duration_minutes, payout_amount_base_units, payout_token_symbol,
        coverage_start, coverage_end, max_evidence_budget_tinybar,
        active, resolved, resolution_hash, creation_transaction_id
      ) VALUES (
        @policy_id, @policyholder, @data_chain_id, @stablecoin_symbol,
        @stablecoin_address, @reference_pool_address, @threshold_bps,
        @minimum_duration_minutes, @payout_amount_base_units, @payout_token_symbol,
        @coverage_start, @coverage_end, @max_evidence_budget_tinybar,
        @active, @resolved, @resolution_hash, @creation_transaction_id
      )
      ON CONFLICT(policy_id) DO UPDATE SET
        policyholder = excluded.policyholder,
        data_chain_id = excluded.data_chain_id,
        stablecoin_symbol = excluded.stablecoin_symbol,
        stablecoin_address = excluded.stablecoin_address,
        reference_pool_address = excluded.reference_pool_address,
        threshold_bps = excluded.threshold_bps,
        minimum_duration_minutes = excluded.minimum_duration_minutes,
        payout_amount_base_units = excluded.payout_amount_base_units,
        payout_token_symbol = excluded.payout_token_symbol,
        coverage_start = excluded.coverage_start,
        coverage_end = excluded.coverage_end,
        max_evidence_budget_tinybar = excluded.max_evidence_budget_tinybar,
        active = excluded.active,
        resolved = excluded.resolved,
        resolution_hash = excluded.resolution_hash,
        creation_transaction_id = excluded.creation_transaction_id,
        updated_at = datetime('now')`,
    )
    .run({
      policy_id: policy.policyId,
      policyholder: policy.policyholder,
      data_chain_id: policy.dataChainId,
      stablecoin_symbol: policy.stablecoinSymbol,
      stablecoin_address: policy.stablecoinAddress,
      reference_pool_address: policy.referencePoolAddress,
      threshold_bps: policy.thresholdBps,
      minimum_duration_minutes: policy.minimumDurationMinutes,
      payout_amount_base_units: policy.payoutAmountBaseUnits,
      payout_token_symbol: policy.payoutTokenSymbol,
      coverage_start: policy.coverageStart,
      coverage_end: policy.coverageEnd,
      max_evidence_budget_tinybar: policy.maxEvidenceBudgetTinybar,
      active: policy.active ? 1 : 0,
      resolved: policy.resolved ? 1 : 0,
      resolution_hash: policy.resolutionHash ?? null,
      creation_transaction_id: policy.creationTransactionId ?? null,
    });

  const saved = getPolicy(policy.policyId);
  if (!saved) throw new Error(`Policy was not saved: ${policy.policyId}`);
  return saved;
}

export function getPolicy(policyId: string): PolicyTerms | null {
  const row = getDb().prepare(`SELECT ${POLICY_COLUMNS} FROM policies WHERE policy_id = ?`).get(policyId) as
    | PolicyRow
    | undefined;
  return row ? rowToPolicy(row) : null;
}

export function listPolicies(): PolicyTerms[] {
  const rows = getDb()
    .prepare(`SELECT ${POLICY_COLUMNS} FROM policies ORDER BY coverage_start DESC, policy_id ASC`)
    .all() as PolicyRow[];
  return rows.map(rowToPolicy);
}

/** Return policies that can currently be evaluated by the monitoring worker. */
export function listActivePolicies(now = Math.floor(Date.now() / 1000)): PolicyTerms[] {
  const rows = getDb()
    .prepare(
      `SELECT ${POLICY_COLUMNS}
       FROM policies
       WHERE active = 1 AND resolved = 0
         AND coverage_start <= ? AND coverage_end > ?
       ORDER BY coverage_start ASC, policy_id ASC`,
    )
    .all(now, now) as PolicyRow[];
  return rows.map(rowToPolicy);
}

/** Mirror a resolution after an operator decision is anchored on-chain. */
export function markPolicyResolved(policyId: string, resolutionHash: string): PolicyTerms | null {
  const result = getDb()
    .prepare(
      `UPDATE policies
       SET resolved = 1, active = 0, resolution_hash = ?, updated_at = datetime('now')
       WHERE policy_id = ?`,
    )
    .run(resolutionHash, policyId);
  return result.changes === 0 ? null : getPolicy(policyId);
}
