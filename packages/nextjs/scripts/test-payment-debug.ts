/**
 * Test the debug payment endpoint to see detailed logs.
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
  const resourceUrl = process.env.EVIDENCE_URL || "http://localhost:3000/api/debug/payment-test";
  const accountId = requireEnv("BUYER_ACCOUNT_ID");
  const privateKeyStr = requireEnv("BUYER_PRIVATE_KEY");
  const network = (process.env.X402_NETWORK ?? "hedera:testnet") as Network;

  const privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
  const signer = createClientHederaSigner(accountId, privateKey, { network });

  console.log(`[payment-debug] Using network: ${network}`);
  console.log(`[payment-debug] Buyer account: ${accountId}`);

  const client = new x402Client().register(network, new ExactHederaScheme(signer)).setSpendControls(false);
  const httpClient = new x402HTTPClient(client);

  console.log(`[payment-debug] POST ${resourceUrl}`);
  const first = await fetch(resourceUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  if (first.ok) {
    console.log("[payment-debug] ❌ Unexpected 200 response without payment");
    process.exit(1);
  }

  if (first.status !== 402) {
    const body = await first.text();
    console.error(`[payment-debug] ❌ Expected 402, got ${first.status}: ${body}`);
    process.exit(1);
  }

  console.log("[payment-debug] 402 Payment Required — building and signing payment…");
  const challengeBody = await first
    .clone()
    .json()
    .catch(() => undefined);

  console.log("[payment-debug] Challenge body:", JSON.stringify(challengeBody, null, 2));

  const paymentRequired = httpClient.getPaymentRequiredResponse(name => first.headers.get(name), challengeBody);
  console.log("[payment-debug] Payment required:", JSON.stringify(paymentRequired, null, 2));

  const payload = await httpClient.createPaymentPayload(paymentRequired);
  console.log("[payment-debug] Created payload:", JSON.stringify(payload, null, 2));

  const headers = httpClient.encodePaymentSignatureHeader(payload);
  console.log("[payment-debug] Payment headers:", headers);

  console.log("[payment-debug] Retrying with PAYMENT-SIGNATURE…");
  const paid = await fetch(resourceUrl, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({}),
  });

  console.log(`[payment-debug] Second response status: ${paid.status}`);
  const result = await httpClient.processResponse(paid);
  console.log(`[payment-debug] Payment status: ${result.paymentStatus}`);

  if (result.paymentStatus !== "settled") {
    console.error(`[payment-debug] ❌ Payment failed with status: ${result.paymentStatus}`);
    console.error("[payment-debug] Result:", JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const body = result.body as any;
  const txId = body.transaction || "unknown";
  console.log(`[payment-debug] ✅ Payment settled · tx ${txId}`);
  console.log(`[payment-debug] Response:`, JSON.stringify(body, null, 2));
  console.log(`[payment-debug] Verify on HashScan: https://hashscan.io/testnet/transaction/${txId}`);
}

main().catch(error => {
  console.error("[payment-debug]", error instanceof Error ? error.message : error);
  process.exit(1);
});
