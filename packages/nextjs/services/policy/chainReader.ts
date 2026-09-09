import { createPublicClient, http, type Address, type Hex } from "viem";
import { POLICY_REGISTRY_ABI, getPolicyRegistryAddress } from "~~/contracts/policyRegistryAbi";
import { upsertPolicy } from "~~/services/policy/repository";
import type { PolicyTerms } from "~~/services/policy/types";

const HEDERA_TESTNET = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 8 },
  rpcUrls: { default: { http: [process.env.HEDERA_RPC_URL ?? "https://testnet.hashio.io/api"] } },
} as const;

type ChainPolicy = {
  policyholder: Address;
  dataChainId: string;
  stablecoinAddress: Address;
  referencePoolAddress: Address;
  thresholdBps: number;
  minimumDurationMinutes: number;
  payoutAmountBaseUnits: bigint;
  payoutTokenSymbol: string;
  coverageStart: bigint;
  coverageEnd: bigint;
  maxEvidenceBudgetTinybar: bigint;
  active: boolean;
  resolved: boolean;
  resolutionHash: Hex;
};

export class PolicyRegistryNotDeployedError extends Error {
  constructor() {
    super("PolicyRegistry is not deployed. Deploy it with the PolicyRegistry tag first.");
    this.name = "PolicyRegistryNotDeployedError";
  }
}

export async function readPolicyFromHedera(policyId: Hex): Promise<PolicyTerms> {
  const address = getPolicyRegistryAddress();
  if (!address) throw new PolicyRegistryNotDeployedError();
  const client = createPublicClient({ chain: HEDERA_TESTNET, transport: http() });
  const policy = (await client.readContract({ address, abi: POLICY_REGISTRY_ABI, functionName: "getPolicy", args: [policyId] })) as ChainPolicy;
  const terms: PolicyTerms = {
    policyId,
    policyholder: policy.policyholder,
    dataChainId: policy.dataChainId,
    stablecoinSymbol: process.env.EDGRAPH_STABLECOIN_SYMBOL?.trim() || "USDC",
    stablecoinAddress: policy.stablecoinAddress as `0x${string}`,
    referencePoolAddress: policy.referencePoolAddress as `0x${string}`,
    thresholdBps: Number(policy.thresholdBps),
    minimumDurationMinutes: Number(policy.minimumDurationMinutes),
    payoutAmountBaseUnits: policy.payoutAmountBaseUnits.toString(),
    payoutTokenSymbol: policy.payoutTokenSymbol,
    coverageStart: Number(policy.coverageStart),
    coverageEnd: Number(policy.coverageEnd),
    maxEvidenceBudgetTinybar: policy.maxEvidenceBudgetTinybar.toString(),
    active: policy.active,
    resolved: policy.resolved,
    resolutionHash: policy.resolutionHash === "0x" + "0".repeat(64) ? undefined : policy.resolutionHash,
  };
  return upsertPolicy(terms);
}
