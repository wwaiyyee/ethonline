/**
 * Test script for EdGraph Evidence API x402 payment flow
 *
 * Usage:
 *   EVIDENCE_URL="https://edgraph.up.railway.app/api/v1/depeg-evidence" \
 *   BUYER_ACCOUNT_ID=0.0.10461760 \
 *   BUYER_PRIVATE_KEY=0x... \
 *   yarn tsx scripts/test-evidence-payment.ts
 */
import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { Network } from "@x402/core/types";
import { PrivateKey, createClientHederaSigner } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const evidenceUrl = requireEnv("EVIDENCE_URL");
  const accountId = requireEnv("BUYER_ACCOUNT_ID");
  const privateKeyStr = requireEnv("BUYER_PRIVATE_KEY");
  const network = (process.env.X402_NETWORK ?? "hedera:testnet") as Network;

  const privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
  const signer = createClientHederaSigner(accountId, privateKey, { network });

  console.log(`[test-evidence] Using network: ${network}`);
  console.log(`[test-evidence] Buyer account: ${accountId}`);

  const client = new x402Client().register(network, new ExactHederaScheme(signer)).setSpendControls(false);
  const httpClient = new x402HTTPClient(client);

  const requestBody = {
    claimId: "test-payment-001",
    policyId: "0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025",
    lookbackSeconds: 1800,
  };

  console.log(`[test-evidence] POST ${evidenceUrl}`);
  console.log(`[test-evidence] Request body:`, JSON.stringify(requestBody, null, 2));

  const first = await fetch(evidenceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (first.ok) {
    console.log("[test-evidence] Unexpected 200 response (should be 402)");
    const body = await first.json();
    console.log("[test-evidence] Response:", JSON.stringify(body, null, 2));
    process.exit(1);
  }

  if (first.status !== 402) {
    const body = await first.text();
    console.error(`[test-evidence] Expected 402, got ${first.status}: ${body}`);
    process.exit(1);
  }

  console.log("[test-evidence] 402 Payment Required — building and signing payment…");

  const challengeBody = await first
    .clone()
    .json()
    .catch(() => undefined);

  console.log("[test-evidence] Challenge body:", JSON.stringify(challengeBody, null, 2));

  const paymentRequired = httpClient.getPaymentRequiredResponse(name => first.headers.get(name), challengeBody);
  console.log("[test-evidence] Payment required:", JSON.stringify(paymentRequired, null, 2));

  const payload = await httpClient.createPaymentPayload(paymentRequired);
  const paymentHeaders = httpClient.encodePaymentSignatureHeader(payload);

  console.log("[test-evidence] Retrying with PAYMENT-SIGNATURE…");
  const paid = await fetch(evidenceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...paymentHeaders },
    body: JSON.stringify(requestBody),
  });

  console.log(`[test-evidence] Second response status: ${paid.status}`);

  const result = await httpClient.processResponse(paid);
  console.log(`[test-evidence] Payment status: ${result.paymentStatus}`);

  if (result.paymentStatus !== "settled") {
    console.error(`[test-evidence] Payment failed with status: ${result.paymentStatus}`);
    process.exit(1);
  }

  const body = result.body as any;
  const txId = body.payment?.transaction || (result as any).settleResponse?.transaction || "unknown";
  console.log(`[test-evidence] ✅ Payment settled · tx ${txId}`);
  console.log(`[test-evidence] Evidence:`, JSON.stringify(body, null, 2));
  console.log(`[test-evidence] Verify on HashScan: https://hashscan.io/testnet/transaction/${txId}`);
}

main().catch(error => {
  console.error("[test-evidence]", error instanceof Error ? error.message : error);
  process.exit(1);
});
