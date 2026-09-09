import { queryPoolData } from "~~/services/graph/client";
import { getGraphConfig } from "~~/services/graph/config";
import { calculateLiquidityChangeBps, calculateRecentMovementBps, calculateSwapVolumeUsd, toUsdMicros } from "~~/services/graph/price";
import type { MarketObservation, PolicyTerms } from "~~/services/policy/types";

export type PoolRiskSnapshot = {
  mode: "live";
  chain: "base";
  poolAddress: string;
  currentPriceUsdMicros: number;
  recentPriceMovementBps: number;
  liquidityUsdMicros: number;
  liquidityChangeBps: number;
  swapVolumeUsdMicros: number;
  observationTimestamps: number[];
  observation: MarketObservation;
  provenance: Awaited<ReturnType<typeof queryPoolData>>["provenance"];
};

/** Load-bearing agent tool: the spend decision is made from this live Graph snapshot. */
export async function queryPoolRiskSnapshot(policyId: string, observedAt = Math.floor(Date.now() / 1000)): Promise<PoolRiskSnapshot> {
  const config = getGraphConfig();
  const data = await queryPoolData({ config });
  const latest = data.samples[data.samples.length - 1];
  const currentPriceUsdMicros = toUsdMicros(latest?.priceUsd ?? 0);
  const observation: MarketObservation = {
    policyId,
    observedAt,
    priceUsdMicros: currentPriceUsdMicros,
    liquidityUsdMicros: toUsdMicros(Number(data.pool.totalValueLockedUSD)),
    volumeUsdMicros: toUsdMicros(calculateSwapVolumeUsd(data)),
    sourceBlock: data.provenance.latestBlock,
    sourceTimestamp: latest?.timestamp,
    dataComplete: Boolean(latest && data.provenance.latestBlock),
    sourceName: "the-graph",
  };

  return {
    mode: "live",
    chain: "base",
    poolAddress: config.poolAddress,
    currentPriceUsdMicros,
    recentPriceMovementBps: calculateRecentMovementBps(data.samples),
    liquidityUsdMicros: observation.liquidityUsdMicros,
    liquidityChangeBps: calculateLiquidityChangeBps(data),
    swapVolumeUsdMicros: observation.volumeUsdMicros,
    observationTimestamps: data.samples.map(sample => sample.timestamp),
    observation,
    provenance: data.provenance,
  };
}

export function shouldBuyEvidence(snapshot: PoolRiskSnapshot, policy: PolicyTerms): { buy: boolean; rationale: string } {
  const thresholdMicros = Math.round((policy.thresholdBps / 10_000) * 1_000_000);
  const belowThreshold = snapshot.currentPriceUsdMicros < thresholdMicros;
  const worsening = snapshot.recentPriceMovementBps < -25 || snapshot.liquidityChangeBps < -100;
  if (belowThreshold || worsening) {
    return {
      buy: true,
      rationale: `Live Graph snapshot: price=${snapshot.currentPriceUsdMicros / 1_000_000} USD, movement=${snapshot.recentPriceMovementBps} bps, liquidity change=${snapshot.liquidityChangeBps} bps. Deeper evidence is justified.`,
    };
  }
  return {
    buy: false,
    rationale: `Live Graph snapshot is below risk triggers: price=${snapshot.currentPriceUsdMicros / 1_000_000} USD, movement=${snapshot.recentPriceMovementBps} bps, liquidity change=${snapshot.liquidityChangeBps} bps.`,
  };
}
