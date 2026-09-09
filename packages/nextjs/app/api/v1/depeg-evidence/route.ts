import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentResponseHeader,
  encodePaymentRequiredHeader,
} from "@x402/core/http";
import type { PaymentRequirements, ResourceInfo } from "@x402/core/types";
import { ensureClaim, updateClaimAgentDecision } from "~~/services/claims/repository";
import { recordEvidence, recordSettledPayment } from "~~/services/evidence/repository";
import { buildDepegEvidence } from "~~/services/graph/evidence";
import { evaluateEvidence } from "~~/services/policy/engine";
import { getPolicy } from "~~/services/policy/repository";
import {
  HBAR_ASSET,
  MAX_TIMEOUT_SECONDS,
  X402_NETWORK,
  getResourceServer,
  makeHttpContext,
} from "~~/services/x402/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_TINYBAR = process.env.EDGRAPH_EVIDENCE_PRICE_TINYBAR?.trim() || "100000";
const PAY_TO = process.env.EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID?.trim();

export async function POST(req: Request) {
  let body: { policyId?: string; claimId?: string; lookbackSeconds?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body.policyId) return NextResponse.json({ error: "policyId is required." }, { status: 400 });
  const policy = getPolicy(body.policyId);
  if (!policy) return NextResponse.json({ error: "Policy is not mirrored in the EdGraph database." }, { status: 404 });
  if (!PAY_TO) return NextResponse.json({ error: "Evidence payment recipient is not configured." }, { status: 503 });

  const claimId = body.claimId || `claim-${policy.policyId}`;
  ensureClaim(claimId, policy);
  const { context, resourceUrl } = makeHttpContext(req);
  let server;
  try {
    server = await getResourceServer();
  } catch (error) {
    console.error("[api/v1/depeg-evidence] facilitator unavailable", error);
    return NextResponse.json({ error: "Payment facilitator unavailable." }, { status: 502 });
  }
  const requirements = await server.buildPaymentRequirementsFromOptions(
    [{ scheme: "exact", network: X402_NETWORK, payTo: PAY_TO, price: { asset: HBAR_ASSET, amount: PRICE_TINYBAR }, maxTimeoutSeconds: MAX_TIMEOUT_SECONDS }],
    context,
  );
  const resourceInfo: ResourceInfo = {
    url: resourceUrl,
    description: "EdGraph live Base pool depeg evidence",
    mimeType: "application/json",
  };

  if (!context.paymentHeader) return paymentRequired(server, requirements, resourceInfo);

  let payload;
  try {
    payload = decodePaymentSignatureHeader(context.paymentHeader);
  } catch {
    return paymentRequired(server, requirements, resourceInfo, "Malformed payment header");
  }
  const matched = server.findMatchingRequirements(requirements, payload);
  if (!matched) return paymentRequired(server, requirements, resourceInfo, "Payment does not match requirements");
  const verification = await server.verifyPayment(payload, matched);
  if (!verification.isValid) {
    const reason = ("invalidMessage" in verification && typeof verification.invalidMessage === "string" ? verification.invalidMessage : undefined) ?? verification.invalidReason ?? "Payment is not valid";
    return paymentRequired(server, requirements, resourceInfo, reason);
  }
  const settlement = await server.settlePayment(payload, matched);
  if (!settlement.success) return NextResponse.json({ error: "Payment settlement failed", reason: settlement.errorReason }, { status: 402 });

  const paymentId = randomUUID();
  recordSettledPayment({
    paymentId,
    claimId,
    amountTinybar: PRICE_TINYBAR,
    transactionId: settlement.transaction,
    payer: settlement.payer,
    paymentRequired: matched,
  });

  try {
    updateClaimAgentDecision(claimId, "BUY_EVIDENCE", "Evidence purchased after the x402 HBAR settlement.");
    const evidence = await buildDepegEvidence(policy, body.lookbackSeconds);
    const decision = evaluateEvidence(policy, evidence);
    const evidenceId = recordEvidence(claimId, paymentId, evidence);
    const response = NextResponse.json({
      service: "edgraph-evidence-api",
      claimId,
      policyId: policy.policyId,
      evidenceId,
      evidence,
      policyDecision: decision,
      payment: { transaction: settlement.transaction, payer: settlement.payer, network: settlement.network },
    });
    response.headers.set("PAYMENT-RESPONSE", encodePaymentResponseHeader(settlement));
    return response;
  } catch (error) {
    console.error("[api/v1/depeg-evidence] evidence query failed after settlement", error);
    return NextResponse.json({ error: "Payment settled, but live Graph evidence could not be generated.", payment: settlement }, { status: 502 });
  }
}

async function paymentRequired(
  server: Awaited<ReturnType<typeof getResourceServer>>,
  requirements: PaymentRequirements[],
  resourceInfo: ResourceInfo,
  error = "Payment required",
) {
  const paymentRequiredBody = await server.createPaymentRequiredResponse(requirements, resourceInfo, error);
  const response = NextResponse.json(paymentRequiredBody, { status: 402 });
  response.headers.set("PAYMENT-REQUIRED", encodePaymentRequiredHeader(paymentRequiredBody));
  return response;
}
