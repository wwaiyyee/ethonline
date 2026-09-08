import type { Address } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";

const POLICY_COMPONENTS = [
  { name: "creator", type: "address" },
  { name: "policyholder", type: "string" },
  { name: "dataChainId", type: "string" },
  { name: "stablecoinSymbol", type: "string" },
  { name: "stablecoinAddress", type: "address" },
  { name: "referencePoolAddress", type: "address" },
  { name: "thresholdBps", type: "uint256" },
  { name: "minimumDurationMinutes", type: "uint256" },
  { name: "payoutAmountBaseUnits", type: "uint256" },
  { name: "payoutTokenSymbol", type: "string" },
  { name: "coverageStart", type: "uint256" },
  { name: "coverageEnd", type: "uint256" },
  { name: "maxEvidenceBudgetTinybar", type: "uint256" },
  { name: "active", type: "bool" },
  { name: "resolved", type: "bool" },
  { name: "resolutionHash", type: "bytes32" },
  { name: "exists", type: "bool" },
] as const;

export const POLICY_REGISTRY_ABI = [
  {
    type: "function",
    name: "createPolicy",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policyholder", type: "string" },
      { name: "dataChainId", type: "string" },
      { name: "stablecoinSymbol", type: "string" },
      { name: "stablecoinAddress", type: "address" },
      { name: "referencePoolAddress", type: "address" },
      { name: "thresholdBps", type: "uint256" },
      { name: "minimumDurationMinutes", type: "uint256" },
      { name: "payoutAmountBaseUnits", type: "uint256" },
      { name: "payoutTokenSymbol", type: "string" },
      { name: "coverageStart", type: "uint256" },
      { name: "coverageEnd", type: "uint256" },
      { name: "maxEvidenceBudgetTinybar", type: "uint256" },
    ],
    outputs: [{ name: "policyId", type: "bytes32" }],
  },
  { type: "function", name: "getPolicyCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "getPolicy",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: POLICY_COMPONENTS }],
  },
  {
    type: "function",
    name: "getPolicies",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      { name: "ids", type: "bytes32[]" },
      { name: "policies", type: "tuple[]", components: POLICY_COMPONENTS },
    ],
  },
] as const;

export function getPolicyRegistryAddress(chainId: number): Address | undefined {
  const configured = process.env.POLICY_REGISTRY_ADDRESS ?? process.env.NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS;
  if (configured) return configured as Address;
  const contracts = (deployedContracts as Record<number, Record<string, { address?: string }>>)[chainId];
  return contracts?.PolicyRegistry?.address as Address | undefined;
}

export function getPolicyRegistryHederaContractId(chainId: number): string | undefined {
  const configured =
    process.env.POLICY_REGISTRY_HEDERA_CONTRACT_ID ?? process.env.NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID;
  if (configured?.trim()) return configured.trim();
  const contracts = (deployedContracts as Record<number, Record<string, { hederaContractId?: string }>>)[chainId];
  return contracts?.PolicyRegistry?.hederaContractId;
}
