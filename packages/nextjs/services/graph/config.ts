import type { EdGraphDataChain } from "~~/services/policy/types";

export const GRAPH_CHAIN: EdGraphDataChain = "base";
export const DEFAULT_GRAPH_LOOKBACK_SECONDS = 30 * 60;

export class GraphConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphConfigurationError";
  }
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new GraphConfigurationError(`Missing ${name}. Configure a live The Graph provider first.`);
  return value;
}

export type GraphConfig = {
  endpoint: string;
  provenanceEndpoint: string;
  subgraphId?: string;
  poolAddress: `0x${string}`;
  stablecoinAddress: `0x${string}`;
  stablecoinSymbol: string;
  quoteTokenAddress: `0x${string}`;
  quoteTokenSymbol: string;
  quoteTokenUsdPrice: number;
};

/**
 * Resolve a Graph Gateway endpoint without exposing an API key in reports.
 * An explicit endpoint is preferred so hosted providers work unchanged.
 */
export function getGraphConfig(): GraphConfig {
  const subgraphId = process.env.EDGRAPH_GRAPH_SUBGRAPH_ID?.trim() || undefined;
  const apiKey = process.env.EDGRAPH_GRAPH_API_KEY?.trim();
  const endpoint =
    process.env.EDGRAPH_GRAPH_ENDPOINT?.trim() ||
    (subgraphId && apiKey ? `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId}` : undefined);

  if (!endpoint) {
    throw new GraphConfigurationError(
      "Set EDGRAPH_GRAPH_ENDPOINT or both EDGRAPH_GRAPH_SUBGRAPH_ID and EDGRAPH_GRAPH_API_KEY.",
    );
  }

  const poolAddress = required("EDGRAPH_GRAPH_POOL_ADDRESS").toLowerCase();
  const stablecoinAddress = required("EDGRAPH_STABLECOIN_ADDRESS").toLowerCase();
  const quoteTokenAddress = required("EDGRAPH_QUOTE_TOKEN_ADDRESS").toLowerCase();
  const quoteTokenUsdPrice = Number(process.env.EDGRAPH_QUOTE_TOKEN_USD_PRICE ?? "1");

  if (!/^0x[0-9a-f]{40}$/.test(poolAddress)) {
    throw new GraphConfigurationError("EDGRAPH_GRAPH_POOL_ADDRESS must be a 20-byte EVM address.");
  }
  if (!/^0x[0-9a-f]{40}$/.test(stablecoinAddress) || !/^0x[0-9a-f]{40}$/.test(quoteTokenAddress)) {
    throw new GraphConfigurationError("Stablecoin and quote token addresses must be 20-byte EVM addresses.");
  }
  if (!Number.isFinite(quoteTokenUsdPrice) || quoteTokenUsdPrice <= 0) {
    throw new GraphConfigurationError("EDGRAPH_QUOTE_TOKEN_USD_PRICE must be a positive number.");
  }

  return {
    endpoint,
    provenanceEndpoint: endpoint.replace(/\/api\/[^/]+(?=\/subgraphs\/)/, "/api/[redacted]"),
    subgraphId,
    poolAddress: poolAddress as `0x${string}`,
    stablecoinAddress: stablecoinAddress as `0x${string}`,
    stablecoinSymbol: process.env.EDGRAPH_STABLECOIN_SYMBOL?.trim() || "USDC",
    quoteTokenAddress: quoteTokenAddress as `0x${string}`,
    quoteTokenSymbol: process.env.EDGRAPH_QUOTE_TOKEN_SYMBOL?.trim() || "WETH",
    quoteTokenUsdPrice,
  };
}
