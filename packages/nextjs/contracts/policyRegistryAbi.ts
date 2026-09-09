import { getAddress, type Address } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";

export const POLICY_REGISTRY_ABI = [
  {
    type: "function",
    name: "getPolicy",
    stateMutability: "view",
    inputs: [{ name: "policyId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "policyholder", type: "address" },
          { name: "dataChainId", type: "string" },
          { name: "stablecoinAddress", type: "address" },
          { name: "referencePoolAddress", type: "address" },
          { name: "thresholdBps", type: "uint16" },
          { name: "minimumDurationMinutes", type: "uint32" },
          { name: "payoutAmountBaseUnits", type: "uint256" },
          { name: "payoutTokenSymbol", type: "string" },
          { name: "coverageStart", type: "uint64" },
          { name: "coverageEnd", type: "uint64" },
          { name: "maxEvidenceBudgetTinybar", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "resolved", type: "bool" },
          { name: "resolutionHash", type: "bytes32" },
        ],
      },
    ],
  },
] as const;

export function getPolicyRegistryAddress(): Address | undefined {
  const env = process.env.POLICY_REGISTRY_ADDRESS ?? process.env.NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS;
  if (env) return getAddress(env);
  const contracts = (deployedContracts as Record<number, Record<string, { address?: string }>>)[296];
  const address = contracts?.PolicyRegistry?.address;
  return address ? getAddress(address) : undefined;
}

