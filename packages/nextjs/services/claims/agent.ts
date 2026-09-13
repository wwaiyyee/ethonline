import { PrivateKey } from "@hiero-ledger/sdk";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { Network } from "@x402/core/types";
import { createClientHederaSigner } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { evaluateClaimWithAI } from "~~/services/ai/claimEvaluation";
import { assessRiskWithAI } from "~~/services/ai/riskAssessment";
import {
  ensureClaim,
  updateClaimAgentDecision,
  updateClaimWithEvaluation,
  updateClaimWithSnapshotData,
} from "~~/services/claims/repository";
import { canSpendEvidence, getEvidencePriceTinybar } from "~~/services/claims/spendPolicy";
import { type PoolRiskSnapshot, queryPoolRiskSnapshot } from "~~/services/graph/agentTool";
import { getPolicy } from "~~/services/policy/repository";
import type { EvidenceReport, PolicyDecision, PolicyTerms } from "~~/services/policy/types";

type EvidenceResponse = {
  claimId: string;
  report: EvidenceReport;
  payment?: { transaction?: string; payer?: string; network?: string };
};

export type ClaimsAgentResult = {
  policy: PolicyTerms;
  claimId: string;
  snapshot: PoolRiskSnapshot;
  action: "BUY_EVIDENCE" | "SKIP_EVIDENCE";
  rationale: string;
  evidence?: EvidenceResponse;
  policyDecision?: PolicyDecision;
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
 * Run the claims-agent workflow: snapshot → decide → pay → evidence → evaluate
 *
 * This orchestrates the full autonomous claims process:
 * 1. Query live Graph snapshot (price, liquidity, volume)
 * 2. Decide whether to buy evidence based on risk indicators
 * 3. Pay for evidence via x402 HBAR payment (if justified)
 * 4. Receive cryptographic evidence report
 * 5. Evaluate evidence against policy terms
 * 6. Store decision in database
 *
 * Server/CLI-only: loads ECDSA private key to authorize HBAR transfers.
 */
export async function runClaimsAgent(input: { policyId: string; claimId?: string }): Promise<ClaimsAgentResult> {
  const policy = getPolicy(input.policyId);
  if (!policy) throw new Error(`Policy ${input.policyId} is not mirrored in the EdGraph database.`);

  const claimId = input.claimId || `claim-${policy.policyId}-${Date.now()}`;

  console.log(`[Agent] Starting claims workflow for policy ${policy.policyId}`);
  console.log(`[Agent] Claim ID: ${claimId}`);

  // Step 1: Initialize claim record
  ensureClaim(claimId, policy);

  // Step 2: Query live Graph snapshot
  console.log(`[Agent] Querying live Graph snapshot for ${policy.stablecoinSymbol}...`);
  const snapshot = await queryPoolRiskSnapshot(policy.policyId);
  console.log(`[Agent] Snapshot: price=$${(snapshot.currentPriceUsdMicros / 1_000_000).toFixed(6)} USD`);
  console.log(`[Agent] Price movement: ${snapshot.recentPriceMovementBps} bps`);
  console.log(`[Agent] Liquidity change: ${snapshot.liquidityChangeBps} bps`);

  // Step 3: AI-powered risk assessment
  console.log(`[Agent] Running AI risk assessment...`);
  const spend = canSpendEvidence({ policy, requestedTinybar: getEvidencePriceTinybar() });
  const aiDecision = await assessRiskWithAI(snapshot, policy, spend.remainingTinybar);

  console.log(`[Agent] AI Decision: ${aiDecision.buyEvidence ? "BUY_EVIDENCE" : "SKIP_EVIDENCE"}`);
  console.log(`[Agent] Risk Level: ${aiDecision.riskLevel}`);
  console.log(`[Agent] Confidence: ${aiDecision.confidence}%`);
  console.log(`[Agent] Rationale: ${aiDecision.rationale}`);

  if (!aiDecision.buyEvidence) {
    updateClaimAgentDecision(claimId, "SKIP_EVIDENCE", aiDecision.rationale);

    // Store snapshot data so UI can display price and duration even when evidence is skipped
    updateClaimWithSnapshotData(
      claimId,
      snapshot.currentPriceUsdMicros,
      0, // Duration is 0 since we're not tracking a depeg event
    );

    console.log(`[Agent] Action: SKIP_EVIDENCE`);
    return { policy, claimId, snapshot, action: "SKIP_EVIDENCE", rationale: aiDecision.rationale };
  }

  // Step 4: Buy evidence via x402 payment
  updateClaimAgentDecision(claimId, "BUY_EVIDENCE", aiDecision.rationale);
  console.log(`[Agent] Action: BUY_EVIDENCE`);
  console.log(`[Agent] Preparing HBAR payment...`);

  const accountId = required("EDGRAPH_AGENT_ACCOUNT_ID");
  const privateKey = PrivateKey.fromStringECDSA(required("EDGRAPH_AGENT_PRIVATE_KEY"));
  const network = (process.env.X402_NETWORK ?? "hedera:testnet") as Network;
  const signer = createClientHederaSigner(accountId, privateKey as any, { network });
  const client = new x402Client().setSpendControls(false).register(network, new ExactHederaScheme(signer));
  const httpClient = new x402HTTPClient(client);
  const evidenceUrl = makeEvidenceUrl();
  const requestBody = { policyId: policy.policyId, claimId };

  console.log(`[Agent] Calling Evidence API: ${evidenceUrl}`);
  const first = await fetch(evidenceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (first.status !== 402) {
    const body = await first.text();
    throw new Error(`Evidence API expected HTTP 402 before payment, received ${first.status}: ${body}`);
  }

  console.log(`[Agent] Received 402 Payment Required`);
  const challengeBody = await first
    .clone()
    .json()
    .catch(() => undefined);
  const paymentRequired = httpClient.getPaymentRequiredResponse(name => first.headers.get(name), challengeBody);

  const payload = await httpClient.createPaymentPayload(paymentRequired);
  console.log(`[Agent] Signing HBAR transfer...`);

  const paymentHeaders = httpClient.encodePaymentSignatureHeader(payload);
  console.log(`[Agent] Retrying with PAYMENT-SIGNATURE header...`);

  const paid = await fetch(evidenceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...paymentHeaders },
    body: JSON.stringify(requestBody),
  });

  const result = await httpClient.processResponse(paid);
  const isSettled = result.paymentStatus === "settled" || (result as unknown as { kind?: string }).kind === "success";
  const settle =
    (result.header && "transaction" in result.header
      ? (result.header as { transaction?: string; payer?: string; network?: string; errorReason?: string })
      : undefined) ??
    (
      result as unknown as {
        settleResponse?: { transaction?: string; payer?: string; network?: string; errorReason?: string };
      }
    ).settleResponse;

  if (!isSettled || !paid.ok) {
    const errorReason =
      settle?.errorReason ??
      (result.header && "error" in result.header ? (result.header as { error?: string }).error : undefined) ??
      result.paymentStatus ??
      (result as unknown as { kind?: string }).kind;
    throw new Error(`Evidence payment failed: ${errorReason}`);
  }

  if (settle?.transaction) {
    console.log(`[Agent] Payment settled: tx ${settle.transaction}`);
  }
  console.log(`[Agent] Evidence received!`);

  const evidence = result.body as EvidenceResponse;

  // Step 5: AI-powered claim evaluation
  console.log(`[Agent] Running AI claim evaluation...`);
  const policyDecision = await evaluateClaimWithAI(policy, evidence.report);
  console.log(`[Agent] AI Evaluation: ${policyDecision.outcome}`);
  console.log(`[Agent] Reasons: ${policyDecision.reasons.join("; ")}`);

  if (policyDecision.outcome === "ELIGIBLE_RECOMMENDATION") {
    // Check if auto-approve is enabled in environment
    const autoApprove = process.env.AI_AUTO_APPROVE === "true";
    const autoApproveThreshold = parseInt(process.env.AI_AUTO_APPROVE_CONFIDENCE_THRESHOLD || "90", 10);

    if (autoApprove && policyDecision.outcome === "ELIGIBLE_RECOMMENDATION") {
      // Check if AI confidence is high enough for auto-approval
      const aiConfidence = policyDecision.confidence || 0;
      if (aiConfidence >= autoApproveThreshold) {
        console.log(`[Agent] AI confidence (${aiConfidence}%) >= threshold (${autoApproveThreshold}%)`);
        console.log(`[Agent] AUTO-APPROVING claim ${claimId}`);
        policyDecision.outcome = "ELIGIBLE";
        policyDecision.reasons.push(`Auto-approved by AI (confidence: ${aiConfidence}%)`);
      } else {
        console.log(`[Agent] AI confidence (${aiConfidence}%) < threshold (${autoApproveThreshold}%)`);
        console.log(`[Agent] Keeping ELIGIBLE_RECOMMENDATION - requires human review`);
      }
    }
  }

  // Store evaluation in database
  updateClaimWithEvaluation(claimId, policyDecision);
  console.log(`[Agent] Claim updated with policy decision`);

  return {
    policy,
    claimId,
    snapshot,
    action: "BUY_EVIDENCE",
    rationale: aiDecision.rationale,
    evidence,
    policyDecision,
    settlement:
      evidence.payment ??
      (settle
        ? {
            transaction: settle.transaction,
            payer: settle.payer,
            network: settle.network,
          }
        : undefined),
  };
}
