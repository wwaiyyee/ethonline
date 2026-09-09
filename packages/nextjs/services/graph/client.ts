import { DEFAULT_GRAPH_LOOKBACK_SECONDS, getGraphConfig, type GraphConfig } from "~~/services/graph/config";
import { hashGraphQuery, makeGraphProvenance } from "~~/services/graph/provenance";
import type { GraphProvenance } from "~~/services/policy/types";

const POOL_QUERY = /* GraphQL */ `
  query EdGraphPool($pool: ID!, $from: Int!) {
    _meta { block { number timestamp } }
    bundle { ethPriceUSD }
    pool(id: $pool) {
      id
      liquidity
      totalValueLockedUSD
      volumeUSD
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      token0Price
      token1Price
      swaps(first: 100, where: { timestamp_gte: $from }, orderBy: timestamp, orderDirection: desc) {
        timestamp
        amount0
        amount1
        amountUSD
        sqrtPriceX96
        transaction { blockNumber }
      }
      poolDayData(first: 2, orderBy: date, orderDirection: desc) {
        date
        tvlUSD
        volumeUSD
      }
    }
  }
`;

type GraphToken = { id: string; symbol: string; decimals: string };
type GraphSwap = {
  timestamp: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  sqrtPriceX96: string;
  transaction?: { blockNumber: string };
};
type GraphPool = {
  id: string;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  token0: GraphToken;
  token1: GraphToken;
  token0Price: string;
  token1Price: string;
  swaps: GraphSwap[];
  poolDayData?: Array<{ date: string; tvlUSD: string; volumeUSD: string }>;
};
type GraphResponse = {
  data?: { _meta?: { block?: { number: number; timestamp: number } }; bundle?: { ethPriceUSD: string }; pool?: GraphPool | null };
  errors?: Array<{ message: string }>;
};

export type GraphPriceSample = { timestamp: number; priceUsd: number; blockNumber?: number };
export type GraphPoolData = {
  pool: GraphPool;
  samples: GraphPriceSample[];
  provenance: GraphProvenance;
};

async function queryGraph(config: GraphConfig, variables: Record<string, unknown>): Promise<GraphResponse> {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: POOL_QUERY, variables }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`The Graph provider returned HTTP ${response.status}.`);
  const payload = (await response.json()) as GraphResponse;
  if (payload.errors?.length) throw new Error(`The Graph query failed: ${payload.errors.map(error => error.message).join("; ")}`);
  if (!payload.data?.pool) throw new Error("The Graph returned no pool for the configured address.");
  return payload;
}

function sqrtPriceToToken1PerToken0(sqrtPriceX96: string, token0Decimals: number, token1Decimals: number): number {
  const sqrt = Number(sqrtPriceX96);
  if (!Number.isFinite(sqrt) || sqrt <= 0) return 0;
  return (sqrt / 2 ** 96) ** 2 * 10 ** (token0Decimals - token1Decimals);
}

function stablePriceFromToken1PerToken0(
  token1PerToken0: number,
  token0: GraphToken,
  token1: GraphToken,
  config: GraphConfig,
  quoteTokenUsdPrice: number,
): number {
  const stable = config.stablecoinAddress;
  const quote = config.quoteTokenAddress;
  const token0Id = token0.id.toLowerCase();
  const token1Id = token1.id.toLowerCase();
  if (token0Id === stable && token1Id === quote) return token1PerToken0 * quoteTokenUsdPrice;
  if (token1Id === stable && token0Id === quote) return (1 / token1PerToken0) * quoteTokenUsdPrice;
  throw new Error("Configured stablecoin and quote token are not the pool's token pair.");
}

export async function queryPoolData(options: { lookbackSeconds?: number; config?: GraphConfig } = {}): Promise<GraphPoolData> {
  const config = options.config ?? getGraphConfig();
  const toTimestamp = Math.floor(Date.now() / 1000);
  const fromTimestamp = toTimestamp - (options.lookbackSeconds ?? DEFAULT_GRAPH_LOOKBACK_SECONDS);
  const variables = { pool: config.poolAddress, from: fromTimestamp };
  const payload = await queryGraph(config, variables);
  const pool = payload.data!.pool!;
  const quoteTokenUsdPrice =
    config.quoteTokenSymbol.toUpperCase() === "WETH"
      ? Number(payload.data?.bundle?.ethPriceUSD)
      : config.quoteTokenUsdPrice;
  if (!Number.isFinite(quoteTokenUsdPrice) || quoteTokenUsdPrice <= 0) {
    throw new Error("The Graph did not return a valid quote-token USD price.");
  }
  const token0Decimals = Number(pool.token0.decimals);
  const token1Decimals = Number(pool.token1.decimals);
  const samples = pool.swaps
    .map(swap => ({
      timestamp: Number(swap.timestamp),
      priceUsd: stablePriceFromToken1PerToken0(
        sqrtPriceToToken1PerToken0(swap.sqrtPriceX96, token0Decimals, token1Decimals),
        pool.token0,
        pool.token1,
        config,
        quoteTokenUsdPrice,
      ),
      blockNumber: swap.transaction?.blockNumber ? Number(swap.transaction.blockNumber) : undefined,
    }))
    .filter(sample => Number.isFinite(sample.priceUsd) && sample.priceUsd > 0);

  const currentPoolPrice =
    pool.token0.id.toLowerCase() === config.stablecoinAddress
      ? Number(pool.token0Price) * quoteTokenUsdPrice
      : Number(pool.token1Price) * quoteTokenUsdPrice;

  if (!Number.isFinite(currentPoolPrice) || currentPoolPrice <= 0) {
    throw new Error("The Graph returned an invalid current pool price.");
  }
  samples.push({ timestamp: toTimestamp, priceUsd: currentPoolPrice, blockNumber: payload.data?._meta?.block?.number });

  return {
    pool,
    samples: samples.sort((a, b) => a.timestamp - b.timestamp),
    provenance: makeGraphProvenance({
      endpoint: config.provenanceEndpoint,
      subgraphId: config.subgraphId,
      queryHash: hashGraphQuery(POOL_QUERY, variables),
      fromTimestamp,
      toTimestamp,
      latestBlock: payload.data?._meta?.block?.number,
    }),
  };
}
