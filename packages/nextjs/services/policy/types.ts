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

/**
 * Evidence purchased from x402 resource server.
 * `fileId` is the x402 FileRegistry file id (bytes32 hex).
 * `localPath` is where the evidence JSON was saved after download.
 * `amountPaidTinybar` is the x402 price paid (native HBAR).
 */
export type PurchasedEvidence = {
  fileId: string;
  objectKey: string;
  localPath: string;
  amountPaidTinybar: string;
  purchasedAt: number;
  contentHash: string;
};

/**
 * Hedera payment proof for x402 evidence purchases.
 * `transactionId` is the settled Hedera transfer transaction (e.g. "0.0.1234@1234567890.123456789").
 * `payerAccountId` is the policy agent's funded account (e.g. "0.0.5678").
 * `recipientAccountId` is the evidence seller's account (matched against FileRegistry `payToAccountId`).
 */
export type PaymentProof = {
  transactionId: string;
  payerAccountId: string;
  recipientAccountId: string;
  amountTinybar: string;
  timestamp: number;
  memo?: string;
};

/**
 * Claim record combining policy, observations, decision, evidence, and status.
 * Persisted in SQLite and drives the UI claim lifecycle.
 */
export type Claim = {
  claimId: string;
  policyId: string;
  status: ClaimStatus;
  detectedAt: number;
  lowestPriceUsdMicros?: number;
  durationMinutes?: number;
  decision?: PolicyDecision;
  evidenceFileIds?: string[];
  lastAgentAction?: AgentAction;
  lastAgentActionAt?: number;
  resolutionTransactionId?: string;
  approvedAt?: number;
  rejectedAt?: number;
  notes?: string;
};
