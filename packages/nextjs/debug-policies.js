// Debug script to test policy fetching server-side
require('dotenv').config();
const { createPublicClient, http } = require('viem');

const POLICY_COMPONENTS = [
  { name: 'creator', type: 'address' },
  { name: 'policyholder', type: 'string' },
  { name: 'dataChainId', type: 'string' },
  { name: 'stablecoinSymbol', type: 'string' },
  { name: 'stablecoinAddress', type: 'address' },
  { name: 'referencePoolAddress', type: 'address' },
  { name: 'thresholdBps', type: 'uint256' },
  { name: 'minimumDurationMinutes', type: 'uint256' },
  { name: 'payoutAmountBaseUnits', type: 'uint256' },
  { name: 'payoutTokenSymbol', type: 'string' },
  { name: 'coverageStart', type: 'uint256' },
  { name: 'coverageEnd', type: 'uint256' },
  { name: 'maxEvidenceBudgetTinybar', type: 'uint256' },
  { name: 'active', type: 'bool' },
  { name: 'resolved', type: 'bool' },
  { name: 'resolutionHash', type: 'bytes32' },
  { name: 'exists', type: 'bool' }
];

const POLICY_REGISTRY_ABI = [
  { type: 'function', name: 'getPolicyCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  {
    type: 'function',
    name: 'getPolicies',
    stateMutability: 'view',
    inputs: [
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' }
    ],
    outputs: [
      { name: 'ids', type: 'bytes32[]' },
      { name: 'policies', type: 'tuple[]', components: POLICY_COMPONENTS }
    ]
  }
];

async function testPolicyFetch() {
  try {
    const rpcUrl = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';
    const address = '0xC3549920b94a795D75E6C003944943D552C46F97';

    console.log('RPC URL:', rpcUrl);
    console.log('Contract address:', address);

    const client = createPublicClient({
      chain: { id: 296, rpcUrls: { default: { http: [rpcUrl] } } },
      transport: http(rpcUrl)
    });

    console.log('\n1. Testing getPolicyCount...');
    const count = await client.readContract({
      address,
      abi: POLICY_REGISTRY_ABI,
      functionName: 'getPolicyCount'
    });
    console.log('Policy count:', count.toString());

    console.log('\n2. Testing getPolicies...');
    const result = await client.readContract({
      address,
      abi: POLICY_REGISTRY_ABI,
      functionName: 'getPolicies',
      args: [0n, 50n]
    });

    console.log('Got', result[0].length, 'policies');
    console.log('First policy:', JSON.stringify(result[1][0], (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPolicyFetch();
