import { createHash } from "node:crypto";
import type { GraphProvenance } from "~~/services/policy/types";

export function hashGraphQuery(query: string, variables: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify({ query, variables })).digest("hex");
}

export function makeGraphProvenance(input: {
  endpoint: string;
  subgraphId?: string;
  queryHash: string;
  fromTimestamp: number;
  toTimestamp: number;
  latestBlock?: number;
}): GraphProvenance {
  return {
    endpoint: input.endpoint,
    subgraphId: input.subgraphId,
    deployment: input.subgraphId,
    queryHash: input.queryHash,
    fromTimestamp: input.fromTimestamp,
    toTimestamp: input.toTimestamp,
    latestBlock: input.latestBlock,
  };
}

