import type { GraphPoolData } from "~~/services/graph/client";

const MICROS_PER_USD = 1_000_000;

export function toUsdMicros(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * MICROS_PER_USD);
}

export function calculateRecentMovementBps(samples: Array<{ priceUsd: number }>): number {
  if (samples.length < 2 || samples[0].priceUsd <= 0) return 0;
  return Math.round(((samples[samples.length - 1].priceUsd - samples[0].priceUsd) / samples[0].priceUsd) * 10_000);
}

export function calculateLiquidityChangeBps(poolData: GraphPoolData): number {
  const days = poolData.pool.poolDayData ?? [];
  if (days.length < 2 || Number(days[1].tvlUSD) <= 0) return 0;
  return Math.round(((Number(days[0].tvlUSD) - Number(days[1].tvlUSD)) / Number(days[1].tvlUSD)) * 10_000);
}

export function calculateSwapVolumeUsd(poolData: GraphPoolData): number {
  const swapVolume = poolData.pool.swaps.reduce((sum, swap) => sum + Math.abs(Number(swap.amountUSD) || 0), 0);
  return swapVolume || Number(poolData.pool.volumeUSD) || 0;
}

