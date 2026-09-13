import { NextResponse } from "next/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import type { ResourceInfo } from "@x402/core/types";
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
  url: "/api/debug/payment-test",
  description: "x402 payment test endpoint",
  mimeType: "application/json",
};

/**
 * Debug endpoint to test x402 payment flow with detailed logging.
 * This helps diagnose why payments are failing.
 */
export async function POST(req: Request) {
  console.log("[payment-test] === START PAYMENT TEST ===");

  const { context, resourceUrl } = makeHttpContext(req);
  console.log("[payment-test] Context:", {
    method: context.method,
    path: context.path,
    hasPaymentHeader: !!context.paymentHeader,
    paymentHeaderLength: context.paymentHeader?.length,
  });

  let server;
  try {
    server = await getResourceServer();
    console.log("[payment-test] Resource server initialized");
  } catch (error) {
    console.error("[payment-test] Failed to initialize resource server:", error);
    return NextResponse.json({ error: "Payment facilitator unavailable", details: String(error) }, { status: 502 });
  }

  const payTo = process.env.EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID ?? process.env.FACILITATOR_ACCOUNT_ID;
  if (!payTo) {
    console.error("[payment-test] No payTo account configured");
    return NextResponse.json({ error: "Payment account not configured" }, { status: 503 });
  }

  console.log("[payment-test] Building payment requirements with payTo:", payTo);
  const requirements = await server.buildPaymentRequirementsFromOptions(
    [
      {
        scheme: "exact",
        network: X402_NETWORK,
        payTo,
        price: { asset: HBAR_ASSET, amount: "1000000" },
        maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
      },
    ],
    context,
  );
  console.log("[payment-test] Requirements built:", JSON.stringify(requirements, null, 2));

  const info = { ...resourceInfo, url: resourceUrl };

  if (!context.paymentHeader) {
    console.log("[payment-test] No payment header, returning 402");
    const required = await server.createPaymentRequiredResponse(requirements, info, "Payment required (test)");
    const response = NextResponse.json(required, { status: 402 });
    response.headers.set("PAYMENT-REQUIRED", encodePaymentRequiredHeader(required));
    return response;
  }

  console.log("[payment-test] Payment header present, decoding...");
  let payload;
  try {
    payload = decodePaymentSignatureHeader(context.paymentHeader);
    console.log("[payment-test] Decoded payload:", JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("[payment-test] Failed to decode payment header:", error);
    return NextResponse.json({ error: "Malformed payment header", details: String(error) }, { status: 400 });
  }

  console.log("[payment-test] Finding matching requirements...");
  const matched = server.findMatchingRequirements(requirements, payload);
  if (!matched) {
    console.error("[payment-test] No matching requirements found");
    console.error("[payment-test] Payload:", JSON.stringify(payload, null, 2));
    console.error("[payment-test] Requirements:", JSON.stringify(requirements, null, 2));
    return NextResponse.json({ error: "Payment does not match requirements" }, { status: 402 });
  }
  console.log("[payment-test] Matched requirement:", JSON.stringify(matched, null, 2));

  console.log("[payment-test] Verifying payment...");
  const verification = await server.verifyPayment(payload, matched);
  console.log("[payment-test] Verification result:", JSON.stringify(verification, null, 2));
  if (!verification.isValid) {
    console.error("[payment-test] Verification failed:", verification.invalidReason);
    return NextResponse.json(
      { error: "Payment verification failed", reason: verification.invalidReason },
      { status: 402 },
    );
  }

  console.log("[payment-test] Settling payment...");
  const settlement = await server.settlePayment(payload, matched);
  console.log("[payment-test] Settlement result:", JSON.stringify(settlement, null, 2));
  if (!settlement.success) {
    console.error("[payment-test] Settlement failed:", settlement.errorReason);
    return NextResponse.json({ error: "Payment settlement failed", reason: settlement.errorReason }, { status: 402 });
  }

  console.log("[payment-test] === PAYMENT SUCCESS ===");
  const response = NextResponse.json({
    success: true,
    message: "Payment test passed",
    transaction: settlement.transaction,
    payer: settlement.payer,
    network: settlement.network,
  });
  response.headers.set("PAYMENT-RESPONSE", encodePaymentResponseHeader(settlement));
  return response;
}
