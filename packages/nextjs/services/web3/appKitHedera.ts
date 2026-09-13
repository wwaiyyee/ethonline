"use client";

import {
  HederaAdapter,
  HederaChainDefinition,
  HederaProvider,
  hederaNamespace,
} from "@hashgraph/hedera-wallet-connect";
import { createAppKit } from "@reown/appkit/react";
import scaffoldConfig from "~~/scaffold.config";

const projectId = scaffoldConfig.walletConnectProjectId;

const ssrFallbackUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000");

const metadata = {
  name: "EdGraph",
  description: "Stablecoin coverage operations on Hedera",
  url: typeof window !== "undefined" ? window.location.origin : ssrFallbackUrl,
  icons: [typeof window !== "undefined" ? `${window.location.origin}/logo.svg` : `${ssrFallbackUrl}/logo.svg`],
};

export const nativeNetworks = [HederaChainDefinition.Native.Testnet, HederaChainDefinition.Native.Mainnet] as const;

const hederaNativeAdapter = new HederaAdapter({
  projectId,
  networks: [...nativeNetworks],
  namespace: hederaNamespace,
});

let _provider: HederaProvider | null = null;

export async function getHederaProvider(): Promise<HederaProvider> {
  if (typeof window === "undefined") {
    throw new Error("getHederaProvider can only be called in the browser");
  }

  if (!_provider) {
    _provider = (await HederaProvider.init({ projectId, metadata })) as HederaProvider;
  }
  return _provider;
}

/** Hedera account id from the WalletConnect `hedera` namespace (e.g. `hedera:testnet:0.0.x`). */
export function getHederaAccountIdFromSession(provider: HederaProvider | null): string | null {
  if (!provider) return null;
  const session = (provider as unknown as { session?: { namespaces?: Record<string, { accounts?: string[] }> } })
    .session;
  const account = session?.namespaces?.hedera?.accounts?.[0];
  console.log("=== getHederaAccountIdFromSession ===");
  console.log("Session exists:", !!session);
  console.log("Full account string:", account);
  console.log("Namespaces:", session?.namespaces);
  if (!account) return null;
  const accountId = account.split(":")[2];
  console.log("Extracted accountId:", accountId);
  const isValid = accountId && /^\d+\.\d+\.\d+$/.test(accountId);
  console.log("Is valid:", isValid);
  return isValid ? accountId : null;
}

export function hasHederaSession(provider: HederaProvider | null): boolean {
  return getHederaAccountIdFromSession(provider) !== null;
}

let _appKit: ReturnType<typeof createAppKit> | null = null;

export async function initAppKit() {
  if (typeof window === "undefined") {
    throw new Error("initAppKit can only be called in the browser");
  }

  if (_appKit) return _appKit;

  const universalProvider = await getHederaProvider();

  _appKit = createAppKit({
    adapters: [hederaNativeAdapter],
    universalProvider: universalProvider as never,
    projectId,
    metadata,
    networks: [...nativeNetworks],
    defaultNetwork: nativeNetworks[0],
    features: {
      analytics: false,
      email: false,
      socials: [],
      swaps: false,
      onramp: false,
    },
  });

  return _appKit;
}
