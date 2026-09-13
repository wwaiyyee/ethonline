/**
 * x402 agent buyer — pays for a private file from the command line.
 *
 * This is the machine-to-machine counterpart to the in-app Burner Wallet flow:
 * it signs the HBAR transfer with a real Hedera key, so it works for any funded
 * account and is the canonical "agent pays per use" demonstration.
 *
 * Usage:
 *   RESOURCE_URL="http://localhost:3000/api/files/<fileId>/download" \
 *   BUYER_ACCOUNT_ID=0.0.xxxx \
 *   BUYER_PRIVATE_KEY=0x... \
 *   [X402_NETWORK=hedera:testnet] [OUTPUT=./downloaded.bin] \
 *   yarn x402:buy
 */
import { PrivateKey } from "@hiero-ledger/sdk";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { Network } from "@x402/core/types";
import { createClientHederaSigner } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { writeFile } from "node:fs/promises";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const resourceUrl = requireEnv("RESOURCE_URL");
  const accountId = requireEnv("BUYER_ACCOUNT_ID");
  const privateKeyStr = requireEnv("BUYER_PRIVATE_KEY");
  const network = (process.env.X402_NETWORK ?? "hedera:testnet") as Network;
  const output = process.env.OUTPUT ?? "./downloaded.bin";

  const method = (process.env.METHOD ?? (process.env.BODY ? "POST" : "GET")).toUpperCase();
  const requestBody = process.env.BODY;
  const initialHeaders: Record<string, string> = {};
  if (requestBody) {
    initialHeaders["content-type"] = "application/json";
  }

  const privateKey = PrivateKey.fromStringECDSA(privateKeyStr);
  const signer = createClientHederaSigner(accountId, privateKey as any, { network });
  const client = new x402Client().setSpendControls(false).register(network, new ExactHederaScheme(signer));
  const httpClient = new x402HTTPClient(client);

  console.log(`[x402-buy] ${method} ${resourceUrl}`);
  const first = await fetch(resourceUrl, {
    method,
    headers: initialHeaders,
    body: requestBody,
  });

  let downloadUrl: string | undefined;

  if (first.ok) {
    const body = (await first.json()) as { url?: string; [key: string]: unknown };
    if (body.url) {
      console.log("[x402-buy] File is public — no payment required.");
      downloadUrl = body.url;
    } else {
      console.log("[x402-buy] Resource is accessible — no payment required.");
      const formatted = JSON.stringify(body, null, 2);
      await writeFile(output, Buffer.from(formatted, "utf-8"));
      console.log(`[x402-buy] Saved ${Buffer.byteLength(formatted)} bytes to ${output}`);
      return;
    }
  } else if (first.status === 402) {
    console.log("[x402-buy] 402 Payment Required — building and signing payment…");
    const challengeBody = await first
      .clone()
      .json()
      .catch(() => undefined);
    const paymentRequired = httpClient.getPaymentRequiredResponse(name => first.headers.get(name), challengeBody);
    const payload = await httpClient.createPaymentPayload(paymentRequired);
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(payload);

    console.log("[x402-buy] Retrying with PAYMENT-SIGNATURE…");
    const retryHeaders = { ...initialHeaders, ...paymentHeaders };
    const paid = await fetch(resourceUrl, {
      method,
      headers: retryHeaders,
      body: requestBody,
    });
    const result = await httpClient.processResponse(paid);

    const isSettled = result.paymentStatus === "settled" || (result as unknown as { kind?: string }).kind === "success";
    const settle =
      (result.header && "transaction" in result.header
        ? (result.header as { transaction?: string; payer?: string; errorReason?: string })
        : undefined) ??
      (result as unknown as { settleResponse?: { transaction?: string; payer?: string; errorReason?: string } })
        .settleResponse;

    if (!isSettled || !paid.ok) {
      const errorMsg =
        settle?.errorReason ??
        (result.header && "error" in result.header ? (result.header as { error?: string }).error : undefined) ??
        `Payment failed with status ${result.status}`;
      throw new Error(errorMsg);
    }

    if (settle?.transaction) {
      console.log(`[x402-buy] Settled · tx ${settle.transaction}`);
    }

    const body = (result.body ?? {}) as { url?: string; [key: string]: unknown };
    if (body.url) {
      downloadUrl = body.url;
    } else {
      const formatted = typeof body === "string" ? body : JSON.stringify(body, null, 2);
      await writeFile(output, Buffer.from(formatted, "utf-8"));
      console.log(`[x402-buy] Saved response (${Buffer.byteLength(formatted)} bytes) to ${output}`);
      return;
    }
  } else {
    const body = await first.text();
    throw new Error(`Unexpected status ${first.status}: ${body}`);
  }

  if (downloadUrl) {
    console.log("[x402-buy] Downloading file…");
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) throw new Error(`Download failed with status ${fileRes.status}`);
    const bytes = Buffer.from(await fileRes.arrayBuffer());
    await writeFile(output, bytes);
    console.log(`[x402-buy] Saved ${bytes.length} bytes to ${output}`);
  }
}

main().catch(error => {
  console.error("[x402-buy]", error instanceof Error ? error.message : error);
  process.exit(1);
});
