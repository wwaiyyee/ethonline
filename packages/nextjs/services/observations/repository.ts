import { getDb } from "~~/services/db/client";
import type { MarketObservation } from "~~/services/policy/types";

type ObservationRow = {
  observation_id: number;
  policy_id: string;
  observed_at: number;
  price_usd_micros: number;
  liquidity_usd_micros: number;
  volume_usd_micros: number;
  source_block: number | null;
  source_timestamp: number | null;
  data_complete: number;
  source_name: string;
};

function rowToObservation(row: ObservationRow): MarketObservation {
  if (row.source_name !== "the-graph" && row.source_name !== "historical-replay") {
    throw new Error(`Unsupported observation source: ${row.source_name}`);
  }
  return {
    observationId: row.observation_id,
    policyId: row.policy_id,
    observedAt: row.observed_at,
    priceUsdMicros: row.price_usd_micros,
    liquidityUsdMicros: row.liquidity_usd_micros,
    volumeUsdMicros: row.volume_usd_micros,
    sourceBlock: row.source_block ?? undefined,
    sourceTimestamp: row.source_timestamp ?? undefined,
    dataComplete: row.data_complete === 1,
    sourceName: row.source_name,
  };
}

const OBSERVATION_COLUMNS = `
  observation_id, policy_id, observed_at, price_usd_micros,
  liquidity_usd_micros, volume_usd_micros, source_block,
  source_timestamp, data_complete, source_name
`;

/** Insert or update the single minute bucket for a policy. */
export function upsertObservation(observation: MarketObservation): MarketObservation {
  getDb()
    .prepare(
      `INSERT INTO observations (
        policy_id, observed_at, price_usd_micros, liquidity_usd_micros,
        volume_usd_micros, source_block, source_timestamp, data_complete, source_name
      ) VALUES (
        @policy_id, @observed_at, @price_usd_micros, @liquidity_usd_micros,
        @volume_usd_micros, @source_block, @source_timestamp, @data_complete, @source_name
      )
      ON CONFLICT(policy_id, observed_at) DO UPDATE SET
        price_usd_micros = excluded.price_usd_micros,
        liquidity_usd_micros = excluded.liquidity_usd_micros,
        volume_usd_micros = excluded.volume_usd_micros,
        source_block = excluded.source_block,
        source_timestamp = excluded.source_timestamp,
        data_complete = excluded.data_complete,
        source_name = excluded.source_name`,
    )
    .run({
      policy_id: observation.policyId,
      observed_at: observation.observedAt,
      price_usd_micros: observation.priceUsdMicros,
      liquidity_usd_micros: observation.liquidityUsdMicros,
      volume_usd_micros: observation.volumeUsdMicros,
      source_block: observation.sourceBlock ?? null,
      source_timestamp: observation.sourceTimestamp ?? null,
      data_complete: observation.dataComplete ? 1 : 0,
      source_name: observation.sourceName,
    });

  const saved = getObservation(observation.policyId, observation.observedAt);
  if (!saved) throw new Error(`Observation was not saved for ${observation.policyId}`);
  return saved;
}

export function getObservation(policyId: string, observedAt: number): MarketObservation | null {
  const row = getDb()
    .prepare(`SELECT ${OBSERVATION_COLUMNS} FROM observations WHERE policy_id = ? AND observed_at = ?`)
    .get(policyId, observedAt) as ObservationRow | undefined;
  return row ? rowToObservation(row) : null;
}

export function listObservations(policyId: string, fromTimestamp?: number, toTimestamp?: number): MarketObservation[] {
  const filters = ["policy_id = ?"];
  const parameters: Array<string | number> = [policyId];

  if (fromTimestamp !== undefined) {
    filters.push("observed_at >= ?");
    parameters.push(fromTimestamp);
  }
  if (toTimestamp !== undefined) {
    filters.push("observed_at <= ?");
    parameters.push(toTimestamp);
  }

  const rows = getDb()
    .prepare(
      `SELECT ${OBSERVATION_COLUMNS} FROM observations
       WHERE ${filters.join(" AND ")}
       ORDER BY observed_at ASC`,
    )
    .all(...parameters) as ObservationRow[];
  return rows.map(rowToObservation);
}

export function getLatestObservation(policyId: string): MarketObservation | null {
  const row = getDb()
    .prepare(
      `SELECT ${OBSERVATION_COLUMNS} FROM observations
       WHERE policy_id = ? ORDER BY observed_at DESC LIMIT 1`,
    )
    .get(policyId) as ObservationRow | undefined;
  return row ? rowToObservation(row) : null;
}
