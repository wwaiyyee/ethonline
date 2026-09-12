import { type Address, type Hex, createPublicClient, http } from "viem";
import { POLICY_REGISTRY_ABI, getPolicyRegistryAddress } from "~~/contracts/policyRegistryAbi";
import scaffoldConfig from "~~/scaffold.config";
import type { PolicyTerms } from "~~/services/policy/types";

type RawPolicy = {
  creator: Address;
  policyholder: string;
  dataChainId: string;
  stablecoinSymbol: string;
  stablecoinAddress: Address;
  referencePoolAddress: Address;
  thresholdBps: bigint;
  minimumDurationMinutes: bigint;
  payoutAmountBaseUnits: bigint;
  payoutTokenSymbol: string;
  coverageStart: bigint;
  coverageEnd: bigint;
  maxEvidenceBudgetTinybar: bigint;
  active: boolean;
  resolved: boolean;
  resolutionHash: Hex;
  exists: boolean;
};
const targetChain = scaffoldConfig.targetNetworks[0];
let client: ReturnType<typeof createPublicClient> | null = null;
function getClient() {
  return (client ??= createPublicClient({
    chain: targetChain,
    transport: http(process.env.HEDERA_RPC_URL ?? targetChain.rpcUrls.default.http[0]),
  }));
}
function mapPolicy(policyId: Hex, raw: RawPolicy): PolicyTerms {
  return {
    policyId,
    policyholder: raw.policyholder,
    dataChainId: raw.dataChainId,
    stablecoinSymbol: raw.stablecoinSymbol,
    stablecoinAddress: raw.stablecoinAddress as `0x${string}`,
    referencePoolAddress: raw.referencePoolAddress as `0x${string}`,
    thresholdBps: Number(raw.thresholdBps),
    minimumDurationMinutes: Number(raw.minimumDurationMinutes),
    payoutAmountBaseUnits: raw.payoutAmountBaseUnits.toString(),
    payoutTokenSymbol: raw.payoutTokenSymbol,
    coverageStart: Number(raw.coverageStart),
    coverageEnd: Number(raw.coverageEnd),
    maxEvidenceBudgetTinybar: raw.maxEvidenceBudgetTinybar.toString(),
    active: raw.active,
    resolved: raw.resolved,
    resolutionHash: raw.resolutionHash === `0x${"0".repeat(64)}` ? undefined : raw.resolutionHash,
  };
}
export class PolicyRegistryNotDeployedError extends Error {
  constructor() {
    super("PolicyRegistry is not deployed. Deploy it to Hedera before reading policies.");
  }
}
export async function readPolicyFromHedera(policyId: Hex): Promise<PolicyTerms | null> {
  const address = getPolicyRegistryAddress(targetChain.id);
  if (!address) throw new PolicyRegistryNotDeployedError();
  try {
    const raw = (await getClient().readContract({
      address,
      abi: POLICY_REGISTRY_ABI,
      functionName: "getPolicy",
      args: [policyId],
    })) as RawPolicy;
    return raw.exists ? mapPolicy(policyId, raw) : null;
  } catch (error) {
    if (error instanceof Error && /PolicyNotFound|reverted/i.test(error.message)) return null;
    throw error;
  }
}
export async function listPoliciesFromHedera(
  offset = 0,
  limit = 50,
): Promise<{ policies: PolicyTerms[]; total: number }> {
  const address = getPolicyRegistryAddress(targetChain.id);
  if (!address) throw new PolicyRegistryNotDeployedError();
  const chainClient = getClient();
  const [total, page] = await Promise.all([
    chainClient.readContract({ address, abi: POLICY_REGISTRY_ABI, functionName: "getPolicyCount" }) as Promise<bigint>,
    chainClient.readContract({
      address,
      abi: POLICY_REGISTRY_ABI,
      functionName: "getPolicies",
      args: [BigInt(offset), BigInt(Math.min(limit, 50))],
    }) as Promise<readonly [readonly Hex[], readonly RawPolicy[]]>,
  ]);

  // Filter out excluded test policies
  const excludedPolicies = new Set(
    (process.env.EDGRAPH_EXCLUDED_POLICIES || "")
      .split(",")
      .map(id => id.trim().toLowerCase())
      .filter(Boolean),
  );

  const allPolicies = page[1].map((raw, index) => mapPolicy(page[0][index], raw));
  const filteredPolicies = allPolicies.filter(policy => !excludedPolicies.has(policy.policyId.toLowerCase()));

  return { total: Number(total), policies: filteredPolicies };
}
