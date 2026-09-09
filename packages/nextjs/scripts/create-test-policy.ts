import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "~~/services/db/client";

// Load .env file manually
const envPath = join(process.cwd(), ".env");
try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) return;
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error: any) {
  console.error("Warning: Could not load .env file:", error.message);
}

const db = getDb();

const now = Math.floor(Date.now() / 1000);

const testPolicy = {
  policy_id: "test-policy-usdc-1",
  policyholder: "0.0.1234",
  data_chain_id: "1", // Ethereum mainnet
  stablecoin_symbol: "USDC",
  stablecoin_address: process.env.EDGRAPH_STABLECOIN_ADDRESS || "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  reference_pool_address: process.env.EDGRAPH_GRAPH_POOL_ADDRESS || "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  threshold_bps: 9800, // $0.98
  minimum_duration_minutes: 30,
  payout_amount_base_units: "100000000", // 1 HBAR
  payout_token_symbol: "HBAR",
  coverage_start: now - 86400, // Started yesterday
  coverage_end: now + 86400 * 30, // Ends in 30 days
  max_evidence_budget_tinybar: "50000000", // 0.5 HBAR
  active: 1,
  resolved: 0,
};

console.log("=== Creating Test Policy ===\n");

db.prepare(
  `INSERT OR REPLACE INTO policies (
    policy_id, policyholder, data_chain_id,
    stablecoin_symbol, stablecoin_address, reference_pool_address,
    threshold_bps, minimum_duration_minutes, payout_amount_base_units,
    payout_token_symbol, coverage_start, coverage_end,
    max_evidence_budget_tinybar, active, resolved
  ) VALUES (
    @policy_id, @policyholder, @data_chain_id,
    @stablecoin_symbol, @stablecoin_address, @reference_pool_address,
    @threshold_bps, @minimum_duration_minutes, @payout_amount_base_units,
    @payout_token_symbol, @coverage_start, @coverage_end,
    @max_evidence_budget_tinybar, @active, @resolved
  )`,
).run(testPolicy);

console.log("✓ Test policy created:", testPolicy.policy_id);
console.log("  Chain:", testPolicy.data_chain_id);
console.log("  Stablecoin:", testPolicy.stablecoin_symbol);
console.log("  Pool:", testPolicy.reference_pool_address);
console.log("  Threshold:", testPolicy.threshold_bps / 100 + "%", "($0.98)");
console.log("  Min duration:", testPolicy.minimum_duration_minutes, "minutes");
console.log("  Payout:", (BigInt(testPolicy.payout_amount_base_units) / 100_000_000n).toString(), "HBAR");
console.log(
  "  Coverage:",
  new Date(testPolicy.coverage_start * 1000).toISOString(),
  "to",
  new Date(testPolicy.coverage_end * 1000).toISOString(),
);
console.log("  Active:", testPolicy.active === 1 ? "Yes" : "No");

// Verify it was saved
const saved = db.prepare("SELECT * FROM policies WHERE policy_id = ?").get(testPolicy.policy_id);
if (saved) {
  console.log("\n✓ Policy verified in database");
} else {
  console.error("\n✗ Policy not found in database");
  process.exit(1);
}
