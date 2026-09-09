import type { EvidenceReport, PolicyDecision, PolicyTerms } from "~~/services/policy/types";

/** Pure policy evaluation. It recommends; it never transfers funds. */
export function evaluateEvidence(policy: PolicyTerms, evidence: EvidenceReport, evaluatedAt = Math.floor(Date.now() / 1000)): PolicyDecision {
  const reasons: string[] = [];
  if (!evidence.depegVerified) reasons.push("The live evidence window did not satisfy the duration trigger.");
  if (evidence.liquidityChangeBps < -2_000) reasons.push("Liquidity fell by more than 20%, requiring human review.");
  if (evidence.provenance.endpoint.length === 0 || evidence.provenance.latestBlock === undefined) {
    reasons.push("Graph provenance is incomplete.");
  }

  if (!evidence.depegVerified) return { outcome: "INELIGIBLE", reasons, evaluatedAt };
  if (reasons.length > 1) return { outcome: "NEEDS_HUMAN_REVIEW", reasons, evaluatedAt };
  return {
    outcome: "ELIGIBLE_RECOMMENDATION",
    reasons: ["Live Graph evidence satisfies the configured depeg duration and has complete provenance."],
    recommendedPayoutAmountBaseUnits: policy.payoutAmountBaseUnits,
    evaluatedAt,
  };
}

