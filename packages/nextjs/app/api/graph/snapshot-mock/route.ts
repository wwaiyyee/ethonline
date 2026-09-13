import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Mock Graph snapshot endpoint for Bazantic demo when real pool is not indexed */
export async function POST(req: Request) {
  let body: { poolAddress?: string; lookbackSeconds?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const poolAddress = body.poolAddress || "0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C";
  const lookbackSeconds = body.lookbackSeconds || 3600;
  const now = Math.floor(Date.now() / 1000);

  // Mock data simulating realistic Ethereum mainnet pool with minor depeg
  const mockSnapshot = {
    mode: "live",
    chain: "ethereum",
    poolAddress,
    currentPriceUsdMicros: 994200, // 0.9942 USDC (0.58% depeg)
    recentPriceMovementBps: -58, // -0.58% movement
    liquidityUsdMicros: 156000000000, // $156M liquidity (realistic for ETH mainnet)
    liquidityChangeBps: -22, // -0.22% liquidity drop
    swapVolumeUsdMicros: 89000000000, // $89M volume (realistic 24h)
    observationTimestamps: [now - lookbackSeconds, now - lookbackSeconds / 2, now - 300, now],
    observation: {
      policyId: "mock-bazantic-demo",
      observedAt: now,
      priceUsdMicros: 994200,
      liquidityUsdMicros: 156000000000,
      volumeUsdMicros: 89000000000,
      sourceBlock: 21234567,
      sourceTimestamp: now,
      dataComplete: true,
      sourceName: "the-graph-ethereum",
    },
    provenance: {
      endpoint: "https://gateway.thegraph.com/api/[deployed-subgraph]",
      subgraphId: "uniswap-v3-ethereum",
      queryHash: "mock-query-hash",
      latestBlock: 21234567,
      fromTimestamp: now - lookbackSeconds,
      toTimestamp: now,
    },
  };

  return NextResponse.json(mockSnapshot);
}
