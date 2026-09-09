import { getDb } from "~~/services/db/client";
import { listObservations } from "~~/services/observations/repository";
import type { ClaimStatus, MarketObservation, PolicyTerms } from "~~/services/policy/types";

type ClaimCandidate = {
  claimId: string;
  policyId: string;
  triggerWindowStart: number;
  triggerWindowEnd: number;
  observationCount: number;
};

/**
 * Detect potential depeg claims by examining recent observations.
 * Only opens a claim when ALL conditions are satisfied:
 * - Enough data points (at least minimumDurationMinutes)
 * - All prices below threshold
 * - Continuous time window without gaps
 * - No existing open claim for this policy
 */
export function detectDepegCandidate(policy: PolicyTerms): ClaimCandidate | null {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - policy.minimumDurationMinutes * 60;

  // Get observations for the required duration
  const observations = listObservations(policy.policyId, windowStart, now);

  // Check 1: Enough data points?
  if (observations.length < policy.minimumDurationMinutes) {
    return null;
  }

  // Check 2: All observations complete?
  if (!observations.every(obs => obs.dataComplete)) {
    return null;
  }

  // Check 3: All prices below threshold?
  const thresholdMicros = Math.round((policy.thresholdBps / 10_000) * 1_000_000);
  const allBelow = observations.every(obs => obs.priceUsdMicros < thresholdMicros);

  if (!allBelow) {
    return null;
  }

  // Check 4: Continuous window without gaps?
  const hasContinuousCoverage = isContinuous(observations);
  if (!hasContinuousCoverage) {
    return null;
  }

  // Check 5: No existing open claim?
  const existingClaim = getDb()
    .prepare(
      `SELECT claim_id FROM claims
       WHERE policy_id = ?
       AND status NOT IN ('REJECTED', 'APPROVED')
       LIMIT 1`,
    )
    .get(policy.policyId);

  if (existingClaim) {
    return null;
  }

  // Create candidate claim
  const claimId = `claim-${policy.policyId}-${now}`;
  const triggerWindowStart = observations[0].observedAt;
  const triggerWindowEnd = observations[observations.length - 1].observedAt;

  getDb()
    .prepare(
      `INSERT INTO claims (
        claim_id, policy_id, status,
        trigger_window_start, trigger_window_end,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    )
    .run(claimId, policy.policyId, "POTENTIAL_CLAIM" satisfies ClaimStatus, triggerWindowStart, triggerWindowEnd);

  console.log(
    `[detector] Created claim ${claimId} for policy ${policy.policyId}: ` +
      `${observations.length} observations from ${triggerWindowStart} to ${triggerWindowEnd}`,
  );

  return {
    claimId,
    policyId: policy.policyId,
    triggerWindowStart,
    triggerWindowEnd,
    observationCount: observations.length,
  };
}

/**
 * Check if observations form a continuous window (no gaps > 90 seconds).
 * Allows for minor timing variations in the monitoring worker.
 */
function isContinuous(observations: MarketObservation[]): boolean {
  if (observations.length < 2) return true;

  for (let i = 1; i < observations.length; i++) {
    const gap = observations[i].observedAt - observations[i - 1].observedAt;
    if (gap > 90) {
      return false; // Gap too large
    }
  }

  return true;
}

/**
 * Run detector for all active policies. Returns all newly created claims.
 */
export function detectAllCandidates(policies: PolicyTerms[]): ClaimCandidate[] {
  const candidates: ClaimCandidate[] = [];

  for (const policy of policies) {
    if (!policy.active || policy.resolved) {
      continue;
    }

    const now = Math.floor(Date.now() / 1000);
    if (now < policy.coverageStart || now > policy.coverageEnd) {
      continue; // Outside coverage window
    }

    try {
      const candidate = detectDepegCandidate(policy);
      if (candidate) {
        candidates.push(candidate);
      }
    } catch (error) {
      console.error(`[detector] Failed for policy ${policy.policyId}:`, error);
    }
  }

  return candidates;
}
