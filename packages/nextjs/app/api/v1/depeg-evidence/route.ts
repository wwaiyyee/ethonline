import { NextResponse } from "next/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import type { PaymentRequirements, ResourceInfo } from "@x402/core/types";
import { createHash } from "node:crypto";
import { getClaimById } from "~~/services/claims/repository";
import { recordEvidenceAudit } from "~~/services/evidence/repository";
import { buildDepegEvidence } from "~~/services/graph/evidence";
import { getPolicy, listPolicies } from "~~/services/policy/repository";
import type { EvidenceReport } from "~~/services/policy/types";
import {
  HBAR_ASSET,
  MAX_TIMEOUT_SECONDS,
  X402_NETWORK,
  getResourceServer,
  makeHttpContext,
} from "~~/services/x402/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resourceInfo: ResourceInfo = {
  url: "/api/v1/depeg-evidence",
  description: "EdGraph depeg evidence report",
  mimeType: "application/json",
};

async function generateEvidenceReport(policyId: string, claimId: string): Promise<EvidenceReport> {
  console.log(`[Evidence API] Generating evidence for policy ${policyId}, claim ${claimId}`);

  const policy = getPolicy(policyId);
  if (!policy) {
    throw new Error(`Policy ${policyId} not found in EdGraph database`);
  }

  // Generate real evidence from live Graph data
  const report = await buildDepegEvidence(policy, 30 * 60);

  console.log(`[Evidence API] Evidence generated:`);
  console.log(`  - Depeg verified: ${report.depegVerified}`);
  console.log(`  - Lowest price: $${(report.lowestObservedPriceUsdMicros / 1_000_000).toFixed(6)}`);
  console.log(`  - Duration: ${report.belowThresholdDurationMinutes} minutes`);
  console.log(`  - Liquidity change: ${report.liquidityChangeBps} bps`);

  return report;
}

async function handleEvidenceRequest(req: Request) {
  const { context, resourceUrl } = makeHttpContext(req);
  let server;
  try {
    server = await getResourceServer();
  } catch {
    return NextResponse.json({ error: "Payment facilitator unavailable" }, { status: 502 });
  }
  const payTo = process.env.EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID ?? process.env.FACILITATOR_ACCOUNT_ID;
  if (!payTo) return NextResponse.json({ error: "Evidence payment account is not configured" }, { status: 503 });
  const requirements = await server.buildPaymentRequirementsFromOptions(
    [
      {
        scheme: "exact",
        network: X402_NETWORK,
        payTo,
        price: { asset: HBAR_ASSET, amount: process.env.EDGRAPH_EVIDENCE_PRICE_TINYBAR ?? "1000000" },
        maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
      },
    ],
    context,
  );
  const info = { ...resourceInfo, url: resourceUrl };
  if (!context.paymentHeader) return challenge(server, requirements, info);

  let payload;
  try {
    payload = decodePaymentSignatureHeader(context.paymentHeader);
  } catch {
    return challenge(server, requirements, info, "Malformed payment header");
  }
  const matched = server.findMatchingRequirements(requirements, payload);
  if (!matched) return challenge(server, requirements, info, "Payment does not match requirements");
  const verification = await server.verifyPayment(payload, matched);
  if (!verification.isValid)
    return challenge(server, requirements, info, verification.invalidReason ?? "Payment is not valid");
  const settlement = await server.settlePayment(payload, matched);
  if (!settlement.success)
    return NextResponse.json({ error: "Payment settlement failed", reason: settlement.errorReason }, { status: 402 });

  // Extract claimId and policyId from JSON body or URL search parameters
  const url = new URL(req.url);
  let body: Record<string, unknown> | null = null;
  if (req.method === "POST") {
    body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  }

  const claimId =
    (typeof body?.claimId === "string" && body.claimId.trim() ? body.claimId.trim() : null) ||
    url.searchParams.get("claimId")?.trim() ||
    `claim-${Date.now()}`;

  let policyId =
    (typeof body?.policyId === "string" && body.policyId.trim() ? body.policyId.trim() : null) ||
    url.searchParams.get("policyId")?.trim() ||
    null;

  if (!policyId && claimId) {
    const claim = getClaimById(claimId);
    if (claim?.policy_id) {
      policyId = claim.policy_id;
    }
  }

  if (!policyId) {
    const policies = listPolicies();
    if (policies.length > 0) {
      policyId = policies[0].policyId;
    }
  }

  if (!policyId) {
    return NextResponse.json({ error: "policyId is required and no active policies found" }, { status: 400 });
  }

  // Generate real evidence from live Graph data
  const report = await generateEvidenceReport(policyId, claimId);

  const paymentId = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 32);
  recordEvidenceAudit({
    claimId,
    paymentId,
    amountTinybar: matched.amount,
    paymentRequired: requirements,
    transactionId: settlement.transaction,
    facilitatorReference: settlement.transaction,
    report,
  });
  const response = NextResponse.json({
    claimId,
    report,
    payment: { transaction: settlement.transaction, payer: settlement.payer, network: settlement.network },
  });
  response.headers.set("PAYMENT-RESPONSE", encodePaymentResponseHeader(settlement));
  return response;
}

export async function GET(req: Request) {
  return handleEvidenceRequest(req);
}

export async function POST(req: Request) {
  return handleEvidenceRequest(req);
}

async function challenge(
  server: Awaited<ReturnType<typeof getResourceServer>>,
  requirements: PaymentRequirements[],
  info: ResourceInfo,
  error = "Payment required",
) {
  const required = await server.createPaymentRequiredResponse(requirements, info, error);
  const response = NextResponse.json(required, { status: 402 });
  response.headers.set("PAYMENT-REQUIRED", encodePaymentRequiredHeader(required));
  return response;
}
