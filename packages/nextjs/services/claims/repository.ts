import { getDb } from "~~/services/db/client";
import type { ClaimStatus, PolicyTerms } from "~~/services/policy/types";

export function ensureClaim(claimId: string, policy: PolicyTerms): void {
  getDb()
    .prepare(
      `INSERT INTO claims (
        claim_id, policy_id, status, trigger_window_start, trigger_window_end
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(claim_id) DO NOTHING`,
    )
    .run(claimId, policy.policyId, "POTENTIAL_CLAIM" satisfies ClaimStatus, policy.coverageStart, policy.coverageEnd);
}

export function updateClaimAgentDecision(claimId: string, action: string, rationale: string): void {
  getDb()
    .prepare(
      `UPDATE claims SET status = 'INVESTIGATING', agent_action = ?, agent_rationale = ?, updated_at = datetime('now') WHERE claim_id = ?`,
    )
    .run(action, rationale, claimId);
}

