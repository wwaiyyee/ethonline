import { NextResponse } from "next/server";

export const runtime = "edge";
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

  // Mock data simulating a small depeg event
  const mockSnapshot = {
    mode: "live",
    chain: "base",
    poolAddress,
    currentPriceUsdMicros: 995000, // 0.995 USDC (0.5% depeg)
    recentPriceMovementBps: -50, // -0.5% movement
    liquidityUsdMicros: 125000000000, // $125M liquidity
    liquidityChangeBps: -15, // -0.15% liquidity drop
    swapVolumeUsdMicros: 45000000000, // $45M volume
    observationTimestamps: [now - lookbackSeconds, now - lookbackSeconds / 2, now - 300, now],
    observation: {
      policyId: "mock-bazantic-demo",
      observedAt: now,
      priceUsdMicros: 995000,
      liquidityUsdMicros: 125000000000,
      volumeUsdMicros: 45000000000,
      sourceBlock: 12345678,
      sourceTimestamp: now,
      dataComplete: true,
      sourceName: "mock-the-graph",
    },
    provenance: {
      endpoint: "https://gateway.thegraph.com/api/mock",
      subgraphId: "mock-for-demo",
      queryHash: "mock-hash",
      latestBlock: 12345678,
      fromTimestamp: now - lookbackSeconds,
      toTimestamp: now,
    },
  };

  return NextResponse.json(mockSnapshot);
}
