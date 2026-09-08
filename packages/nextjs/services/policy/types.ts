/** The one supported market chain in the EdGraph MVP. */
export const EDGRAPH_DATA_CHAIN = "base" as const;
export type EdGraphDataChain = typeof EDGRAPH_DATA_CHAIN;

/** Values used by the deterministic policy engine and persisted in claims. */
export type DecisionOutcome = "ELIGIBLE_RECOMMENDATION" | "INELIGIBLE" | "NEEDS_HUMAN_REVIEW";

export type ClaimStatus =
  | "POTENTIAL_CLAIM"
  | "INVESTIGATING"
  | "EVIDENCE_READY"
  | DecisionOutcome
  | "APPROVED"
  | "REJECTED";

export type AgentAction = "BUY_EVIDENCE" | "SKIP_EVIDENCE" | "FAILED";

/**
 * Terms committed by PolicyRegistry. Monetary values are strings so a value
 * never loses precision while crossing JSON, SQLite, and Solidity boundaries.
 * `thresholdBps: 9800` means a price strictly below $0.98.
 */
export type PolicyTerms = {
  policyId: string;
  policyholder: string;
  dataChainId: string;
  stablecoinSymbol: string;
  stablecoinAddress: `0x${string}`;
  referencePoolAddress: `0x${string}`;
  thresholdBps: number;
  minimumDurationMinutes: number;
  payoutAmountBaseUnits: string;
  payoutTokenSymbol: string;
  coverageStart: number;
  coverageEnd: number;
  maxEvidenceBudgetTinybar: string;
  active: boolean;
  resolved: boolean;
  resolutionHash?: `0x${string}`;
  creationTransactionId?: string;
};

/** One minute of normalized market data from The Graph. */
export type MarketObservation = {
  observationId?: number;
  policyId: string;
  observedAt: number;
  priceUsdMicros: number;
  liquidityUsdMicros: number;
  volumeUsdMicros: number;
  sourceBlock?: number;
  sourceTimestamp?: number;
  dataComplete: boolean;
  sourceName: "the-graph" | "historical-replay";
};

export type GraphProvenance = {
  endpoint: string;
  subgraphId?: string;
  deployment?: string;
  queryHash: string;
  fromTimestamp: number;
  toTimestamp: number;
  latestBlock?: number;
};

export type EvidenceReport = {
  depegVerified: boolean;
  lowestObservedPriceUsdMicros: number;
  belowThresholdDurationMinutes: number;
  liquidityChangeBps: number;
  sellVolumeMultipleBps?: number;
  evidence: string[];
  provenance: GraphProvenance;
};

export type PolicyDecision = {
  outcome: DecisionOutcome;
  reasons: string[];
  recommendedPayoutAmountBaseUnits?: string;
  evaluatedAt: number;
};
