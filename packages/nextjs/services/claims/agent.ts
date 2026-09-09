import { PrivateKey } from "@hiero-ledger/sdk";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { Network } from "@x402/core/types";
import { createClientHederaSigner } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { ensureClaim, updateClaimAgentDecision } from "~~/services/claims/repository";
import { queryPoolRiskSnapshot, shouldBuyEvidence, type PoolRiskSnapshot } from "~~/services/graph/agentTool";
import { getPolicy } from "~~/services/policy/repository";
import { canSpendEvidence, getEvidencePriceTinybar } from "~~/services/claims/spendPolicy";
import type { EvidenceReport, PolicyDecision, PolicyTerms } from "~~/services/policy/types";

type EvidenceResponse = {
  service: string;
  claimId: string;
  policyId: string;
  evidence: EvidenceReport;
  policyDecision: PolicyDecision;
  payment?: { transaction?: string; payer?: string; network?: string };
};

export type ClaimsAgentResult = {
  policy: PolicyTerms;
  claimId: string;
  snapshot: PoolRiskSnapshot;
  action: "BUY_EVIDENCE" | "SKIP_EVIDENCE";
  rationale: string;
  evidence?: EvidenceResponse;
  settlement?: { transaction?: string; payer?: string; network?: string };
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function makeEvidenceUrl(): string {
  const value = process.env.EDGRAPH_EVIDENCE_API_URL?.trim() || "http://localhost:3000/api/v1/depeg-evidence";
  return new URL(value).toString();
}

/**
 * Run the claims-agent workflow. This module is server/CLI-only because it
 * loads an ECDSA private key to authorize the x402 HBAR transfer.
 */
export async function runClaimsAgent(input: { policyId: string; claimId?: string }): Promise<ClaimsAgentResult> {
  const policy = getPolicy(input.policyId);
  if (!policy) throw new Error(`Policy ${input.policyId} is not mirrored in the EdGraph database.`);

  const claimId = input.claimId || `claim-${policy.policyId}`;
  ensureClaim(claimId, policy);
  const snapshot = await queryPoolRiskSnapshot(policy.policyId);
  const trigger = shouldBuyEvidence(snapshot, policy);
  const spend = canSpendEvidence({ policy, requestedTinybar: getEvidencePriceTinybar() });

  if (!trigger.buy || !spend.allowed) {
    const rationale = trigger.buy ? `${trigger.rationale} ${spend.rationale}` : trigger.rationale;
    updateClaimAgentDecision(claimId, "SKIP_EVIDENCE", rationale);
    return { policy, claimId, snapshot, action: "SKIP_EVIDENCE", rationale };
  }

  updateClaimAgentDecision(claimId, "BUY_EVIDENCE", `${trigger.rationale} ${spend.rationale}`);
  const accountId = required("EDGRAPH_AGENT_ACCOUNT_ID");
  const privateKey = PrivateKey.fromStringECDSA(required("EDGRAPH_AGENT_PRIVATE_KEY"));
  const network = (process.env.X402_NETWORK ?? "hedera:testnet") as Network;
  const signer = createClientHederaSigner(accountId, privateKey, { network });
  const client = new x402Client().register(network, new ExactHederaScheme(signer));
  const httpClient = new x402HTTPClient(client);
  const evidenceUrl = makeEvidenceUrl();
  const requestBody = { policyId: policy.policyId, claimId };

  const first = await fetch(evidenceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(requestBody),
  });
  if (first.status !== 402) {
    const body = await first.text();
    throw new Error(`Evidence API expected HTTP 402 before payment, received ${first.status}: ${body}`);
  }

  const challengeBody = await first.clone().json().catch(() => undefined);
  const paymentRequired = httpClient.getPaymentRequiredResponse(name => first.headers.get(name), challengeBody);
  const payload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(payload);
  const paid = await fetch(evidenceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...paymentHeaders },
    body: JSON.stringify(requestBody),
  });
  const result = await httpClient.processResponse(paid);
  if (result.kind !== "success") {
    throw new Error(`Evidence payment failed: ${result.kind}`);
  }

  const evidence = result.body as EvidenceResponse;
  return {
    policy,
    claimId,
    snapshot,
    action: "BUY_EVIDENCE",
    rationale: `${trigger.rationale} ${spend.rationale}`,
    evidence,
    settlement: evidence.payment ?? {
      transaction: result.settleResponse.transaction,
      payer: result.settleResponse.payer,
      network: result.settleResponse.network,
    },
  };
}
