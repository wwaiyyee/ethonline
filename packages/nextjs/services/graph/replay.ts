import { getDb } from "~~/services/db/client";
import { queryPoolData } from "~~/services/graph/client";
import { getGraphConfig } from "~~/services/graph/config";
import { calculateSwapVolumeUsd, toUsdMicros } from "~~/services/graph/price";
import { upsertObservation } from "~~/services/observations/repository";
import type { MarketObservation, PolicyTerms } from "~~/services/policy/types";

export type ReplayWindow = {
  startTimestamp: number;
  endTimestamp: number;
  intervalSeconds: number;
};

/**
 * Replay historical Graph data into the observations table.
 * Uses the same monitoring and detector pipeline as live mode.
 */
export async function replayHistoricalWindow(policy: PolicyTerms, window: ReplayWindow): Promise<MarketObservation[]> {
  console.log(
    `[replay] Starting historical replay for policy ${policy.policyId} ` +
      `from ${window.startTimestamp} to ${window.endTimestamp}`,
  );

  const config = getGraphConfig();
  const observations: MarketObservation[] = [];

  // Generate observation timestamps
  const timestamps: number[] = [];
  for (let ts = window.startTimestamp; ts <= window.endTimestamp; ts += window.intervalSeconds) {
    timestamps.push(ts);
  }

  console.log(`[replay] Generating ${timestamps.length} observations`);

  // Query Graph data for entire window
  const lookbackSeconds = window.endTimestamp - window.startTimestamp + 300;
  const data = await queryPoolData({ config, lookbackSeconds });

  console.log(`[replay] Received ${data.samples.length} Graph samples`);

  // Create observations by sampling from Graph data
  for (const observedAt of timestamps) {
    // Find closest Graph sample
    const closest = data.samples.reduce((prev, curr) =>
      Math.abs(curr.timestamp - observedAt) < Math.abs(prev.timestamp - observedAt) ? curr : prev,
    );

    if (!closest) {
      console.warn(`[replay] No Graph sample found near ${observedAt}`);
      continue;
    }

    const observation: MarketObservation = {
      policyId: policy.policyId,
      observedAt,
      priceUsdMicros: toUsdMicros(closest.priceUsd),
      liquidityUsdMicros: toUsdMicros(Number(data.pool.totalValueLockedUSD)),
      volumeUsdMicros: toUsdMicros(calculateSwapVolumeUsd(data)),
      sourceBlock: closest.blockNumber,
      sourceTimestamp: closest.timestamp,
      dataComplete: true,
      sourceName: "historical-replay",
    };

    const saved = upsertObservation(observation);
    observations.push(saved);

    if (observations.length % 10 === 0) {
      console.log(`[replay] Processed ${observations.length}/${timestamps.length} observations`);
    }
  }

  console.log(
    `[replay] Completed: ${observations.length} observations stored ` +
      `(price range: $${Math.min(...observations.map(o => o.priceUsdMicros / 1_000_000)).toFixed(4)} - ` +
      `$${Math.max(...observations.map(o => o.priceUsdMicros / 1_000_000)).toFixed(4)})`,
  );

  return observations;
}

/**
 * Create a replay window for demonstration purposes.
 * Returns a window that would trigger a depeg claim based on the policy threshold.
 */
export function createDemoReplayWindow(
  policy: PolicyTerms,
  options: {
    endAtCurrentTime?: boolean;
    depegDurationMinutes?: number;
  } = {},
): ReplayWindow {
  const now = Math.floor(Date.now() / 1000);
  const durationMinutes = options.depegDurationMinutes ?? policy.minimumDurationMinutes + 5;
  const intervalSeconds = 60; // One observation per minute

  const endTimestamp = options.endAtCurrentTime ? now : now - 3600; // 1 hour ago
  const startTimestamp = endTimestamp - durationMinutes * 60;

  return {
    startTimestamp,
    endTimestamp,
    intervalSeconds,
  };
}

/**
 * Check if a policy has replay data (not live data).
 */
export function hasReplayData(policyId: string): boolean {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) as count FROM observations
       WHERE policy_id = ? AND source_name = 'historical-replay'`,
    )
    .get(policyId) as { count: number };

  return row.count > 0;
}

/**
 * Clear all replay data for a policy to start fresh with live monitoring.
 */
export function clearReplayData(policyId: string): number {
  const result = getDb()
    .prepare(
      `DELETE FROM observations
       WHERE policy_id = ? AND source_name = 'historical-replay'`,
    )
    .run(policyId);

  console.log(`[replay] Cleared ${result.changes} replay observations for policy ${policyId}`);
  return result.changes;
}
