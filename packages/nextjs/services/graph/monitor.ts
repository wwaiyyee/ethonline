import { queryPoolRiskSnapshot } from "~~/services/graph/agentTool";
import { upsertObservation } from "~~/services/observations/repository";
import type { PolicyTerms } from "~~/services/policy/types";

/** Fetch and persist one live Graph observation for a policy. */
export async function monitorPolicy(policy: PolicyTerms) {
  const snapshot = await queryPoolRiskSnapshot(policy.policyId);
  return upsertObservation(snapshot.observation);
}

