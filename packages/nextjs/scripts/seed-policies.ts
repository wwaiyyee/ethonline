/**
 * Seed script to populate Railway database with policies from on-chain PolicyRegistry.
 *
 * Usage:
 *   yarn tsx scripts/seed-policies.ts
 *
 * This reads all policies from the PolicyRegistry contract and mirrors them into the
 * EdGraph SQLite database. Run this once after deploying to Railway to initialize the DB.
 */
import { createPublicClient, http } from "viem";
import { POLICY_REGISTRY_ABI, getPolicyRegistryAddress } from "~~/contracts/policyRegistryAbi";
import { getDb } from "~~/services/db/client";

const HEDERA_TESTNET_CHAIN_ID = 296; // Hedera testnet

async function main() {
  const rpcUrl = process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";
  const registryAddress = getPolicyRegistryAddress(HEDERA_TESTNET_CHAIN_ID);

  if (!registryAddress) {
    console.error("❌ PolicyRegistry address not found");
    console.error("   Set POLICY_REGISTRY_ADDRESS in .env or deploy with: yarn hardhat:deploy --network hederaTestnet");
    process.exit(1);
  }

  console.log(`📡 Reading policies from PolicyRegistry at ${registryAddress}...`);
  console.log(`   RPC: ${rpcUrl}\n`);

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const count = await client.readContract({
    address: registryAddress as `0x${string}`,
    abi: POLICY_REGISTRY_ABI,
    functionName: "getPolicyCount",
  });

  console.log(`📊 Found ${count} policies on-chain\n`);

  if (count === 0n) {
    console.log("✅ No policies to seed. Create policies first via the UI or test scripts.");
    return;
  }

  const PAGE_SIZE = 50n;
  const db = getDb();
  let seeded = 0;
  let skipped = 0;

  for (let offset = 0n; offset < count; offset += PAGE_SIZE) {
    const limit = offset + PAGE_SIZE > count ? count - offset : PAGE_SIZE;
    const result = await client.readContract({
      address: registryAddress as `0x${string}`,
      abi: POLICY_REGISTRY_ABI,
      functionName: "getPolicies",
      args: [offset, limit],
    });

    const [ids, policies] = result;

    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      const policyId = ids[i];

      // Check if already exists
      const existing = db.prepare("SELECT policy_id FROM policies WHERE policy_id = ?").get(policyId);
      if (existing) {
        skipped++;
        continue;
      }

      db.prepare(
        `INSERT INTO policies (
          policy_id, policyholder, data_chain_id, stablecoin_symbol,
          stablecoin_address, reference_pool_address, threshold_bps,
          minimum_duration_minutes, payout_amount_base_units, payout_token_symbol,
          coverage_start, coverage_end, max_evidence_budget_tinybar,
          active, resolved
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        policyId,
        policy.policyholder.toLowerCase(),
        policy.dataChainId,
        policy.stablecoinSymbol,
        policy.stablecoinAddress.toLowerCase(),
        policy.referencePoolAddress.toLowerCase(),
        Number(policy.thresholdBps),
        Number(policy.minimumDurationMinutes),
        policy.payoutAmountBaseUnits.toString(),
        policy.payoutTokenSymbol,
        Number(policy.coverageStart),
        Number(policy.coverageEnd),
        policy.maxEvidenceBudgetTinybar.toString(),
        policy.active ? 1 : 0,
        policy.resolved ? 1 : 0,
      );

      seeded++;
      console.log(`✅ Seeded policy ${policyId.slice(0, 10)}... (${policy.stablecoinSymbol})`);
    }
  }

  console.log(`\n🎉 Seed complete:`);
  console.log(`   ${seeded} policies inserted`);
  console.log(`   ${skipped} policies already existed`);
}

main().catch(error => {
  console.error("❌ Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
