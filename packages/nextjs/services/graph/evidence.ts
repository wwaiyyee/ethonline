import { queryPoolData } from "~~/services/graph/client";
import { getGraphConfig } from "~~/services/graph/config";
import { calculateLiquidityChangeBps, calculateSwapVolumeUsd, toUsdMicros } from "~~/services/graph/price";
import type { EvidenceReport, PolicyTerms } from "~~/services/policy/types";

export async function buildDepegEvidence(policy: PolicyTerms, lookbackSeconds = 30 * 60): Promise<EvidenceReport> {
  const config = getGraphConfig();
  const data = await queryPoolData({ config, lookbackSeconds });
  const thresholdUsd = policy.thresholdBps / 10_000;
  const below = data.samples.filter(sample => sample.priceUsd > 0 && sample.priceUsd < thresholdUsd);
  const lowest = Math.min(...data.samples.map(sample => sample.priceUsd));
  const hasContinuousCoverage = below.length > 1 && below.every((sample, index) => index === 0 || sample.timestamp - below[index - 1].timestamp <= 90);
  const belowDuration = hasContinuousCoverage ? Math.max(0, (below[below.length - 1].timestamp - below[0].timestamp) / 60) : 0;
  const report: EvidenceReport = {
    depegVerified: belowDuration >= policy.minimumDurationMinutes,
    lowestObservedPriceUsdMicros: toUsdMicros(Number.isFinite(lowest) ? lowest : 0),
    belowThresholdDurationMinutes: Math.floor(belowDuration),
    liquidityChangeBps: calculateLiquidityChangeBps(data),
    sellVolumeMultipleBps: data.samples.length ? Math.round((calculateSwapVolumeUsd(data) / Math.max(1, Number(data.pool.totalValueLockedUSD))) * 10_000) : 0,
    evidence: [
      `Queried ${data.samples.length} live Graph price samples for ${config.poolAddress}.`,
      `Threshold: $${thresholdUsd.toFixed(4)} for ${policy.minimumDurationMinutes} continuous minutes.`,
      `Observed liquidity: $${Number(data.pool.totalValueLockedUSD || 0).toFixed(2)}; recent swap volume: $${calculateSwapVolumeUsd(data).toFixed(2)}.`,
      belowDuration >= policy.minimumDurationMinutes
        ? "The live Graph window satisfies the duration trigger without observation gaps."
        : "The live Graph window does not prove a continuous duration trigger; sparse swaps are treated as a data gap.",
    ],
    provenance: data.provenance,
  };
  return report;
}
