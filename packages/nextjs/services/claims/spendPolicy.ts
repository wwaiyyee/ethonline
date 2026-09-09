import type { PolicyTerms } from "~~/services/policy/types";

function parseTinybar(value: string, name: string): bigint {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a non-negative integer number of tinybars.`);
  return BigInt(value);
}

export function getEvidencePriceTinybar(): bigint {
  return parseTinybar(process.env.EDGRAPH_EVIDENCE_PRICE_TINYBAR?.trim() || "100000", "EDGRAPH_EVIDENCE_PRICE_TINYBAR");
}

/**
 * Keep the agent's configured spend cap and the policy's on-chain cap in force.
 * Amounts stay as bigint until they cross the JSON boundary.
 */
export function canSpendEvidence(input: {
  policy: PolicyTerms;
  requestedTinybar?: bigint;
  alreadySpentTinybar?: bigint;
}): { allowed: boolean; requestedTinybar: bigint; remainingTinybar: bigint; rationale: string } {
  const requestedTinybar = input.requestedTinybar ?? getEvidencePriceTinybar();
  const alreadySpentTinybar = input.alreadySpentTinybar ?? 0n;
  if (requestedTinybar < 0n || alreadySpentTinybar < 0n) {
    return { allowed: false, requestedTinybar, remainingTinybar: 0n, rationale: "Evidence spend values cannot be negative." };
  }

  const policyBudget = parseTinybar(input.policy.maxEvidenceBudgetTinybar, "policy.maxEvidenceBudgetTinybar");
  const configuredBudget = process.env.EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR?.trim();
  const agentBudget = configuredBudget ? parseTinybar(configuredBudget, "EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR") : policyBudget;
  const budget = policyBudget < agentBudget ? policyBudget : agentBudget;
  const remainingTinybar = budget > alreadySpentTinybar ? budget - alreadySpentTinybar : 0n;
  const allowed = requestedTinybar > 0n && requestedTinybar <= remainingTinybar;

  return {
    allowed,
    requestedTinybar,
    remainingTinybar,
    rationale: allowed
      ? `Evidence spend of ${requestedTinybar} tinybars is within the ${budget} tinybar cap.`
      : `Evidence spend of ${requestedTinybar} tinybars exceeds the ${remainingTinybar} tinybar remaining budget.`,
  };
}
