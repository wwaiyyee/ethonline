import { getDb } from "~~/services/db/client";
import type { ClaimStatus, PolicyDecision, PolicyTerms } from "~~/services/policy/types";

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
      `UPDATE claims
       SET status = CASE
         WHEN ? = 'SKIP_EVIDENCE' THEN 'INVESTIGATING_COMPLETE'
         WHEN ? = 'BUY_EVIDENCE' THEN 'EVIDENCE_PENDING'
         WHEN status IN ('POTENTIAL_CLAIM', 'INVESTIGATING') THEN 'INVESTIGATING'
         ELSE status
       END,
       agent_action = ?,
       agent_rationale = ?,
       updated_at = datetime('now')
       WHERE claim_id = ?`,
    )
    .run(action, action, action, rationale, claimId);
}

export function updateClaimWithEvaluation(claimId: string, decision: PolicyDecision): void {
  const statusMap: Record<PolicyDecision["outcome"], ClaimStatus> = {
    ELIGIBLE_RECOMMENDATION: "ELIGIBLE_RECOMMENDATION",
    INELIGIBLE: "INELIGIBLE",
    INELIGIBLE_RECOMMENDATION: "INELIGIBLE_RECOMMENDATION",
    NEEDS_HUMAN_REVIEW: "NEEDS_HUMAN_REVIEW",
  };

  const newStatus = statusMap[decision.outcome] ?? "NEEDS_REVIEW";

  getDb()
    .prepare(
      `UPDATE claims
       SET status = ?,
           policy_decision_json = ?,
           updated_at = datetime('now')
       WHERE claim_id = ?`,
    )
    .run(newStatus, JSON.stringify(decision), claimId);
}

export function getClaimById(claimId: string) {
  return getDb()
    .prepare(
      `SELECT
        claim_id, policy_id, status,
        trigger_window_start, trigger_window_end,
        agent_action, agent_rationale,
        policy_decision_json,
        approved_at, rejected_at,
        created_at, updated_at
       FROM claims
       WHERE claim_id = ?`,
    )
    .get(claimId) as
    | {
        claim_id: string;
        policy_id: string;
        status: ClaimStatus;
        trigger_window_start: number;
        trigger_window_end: number;
        agent_action: string | null;
        agent_rationale: string | null;
        policy_decision_json: string | null;
        approved_at: string | null;
        rejected_at: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;
}

export function updateClaimStatus(claimId: string, decision: "APPROVED" | "REJECTED"): void {
  if (decision === "APPROVED") {
    getDb()
      .prepare(
        `UPDATE claims
         SET status = 'APPROVED',
             approved_at = datetime('now'),
             updated_at = datetime('now')
         WHERE claim_id = ?`,
      )
      .run(claimId);
  } else {
    getDb()
      .prepare(
        `UPDATE claims
         SET status = 'REJECTED',
             rejected_at = datetime('now'),
             updated_at = datetime('now')
         WHERE claim_id = ?`,
      )
      .run(claimId);
  }
}

export function recordApproval(
  claimId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerAccountId: string,
  note?: string,
): void {
  getDb()
    .prepare(
      `INSERT INTO approvals (claim_id, reviewer_account_id, decision, note)
       VALUES (?, ?, ?, ?)`,
    )
    .run(claimId, reviewerAccountId, decision, note ?? null);
}
