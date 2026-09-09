import { readFileSync } from "fs";
import { join } from "path";
import { createDemoReplayWindow, replayHistoricalWindow } from "~~/services/graph/replay";
import { getPolicy } from "~~/services/policy/repository";

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

async function testReplay() {
  console.log("=== Testing Replay Mode ===\n");

  // Get policy
  const policy = getPolicy("test-policy-usdc-1");
  if (!policy) {
    console.error("✗ Policy not found");
    process.exit(1);
  }
  console.log("✓ Policy loaded:", policy.policyId);

  // Create replay window
  const window = createDemoReplayWindow(policy, {
    endAtCurrentTime: false, // Use historical data
    depegDurationMinutes: 35, // Enough to trigger (policy needs 30)
  });

  console.log("✓ Replay window created:");
  console.log("  Start:", new Date(window.startTimestamp * 1000).toISOString());
  console.log("  End:", new Date(window.endTimestamp * 1000).toISOString());
  console.log("  Duration:", (window.endTimestamp - window.startTimestamp) / 60, "minutes");
  console.log("  Interval:", window.intervalSeconds, "seconds");
  console.log();

  // Run replay
  console.log("Starting replay...\n");
  const observations = await replayHistoricalWindow(policy, window);

  console.log("\n✓ Replay complete!");
  console.log("  Observations created:", observations.length);

  if (observations.length > 0) {
    const prices = observations.map(o => o.priceUsdMicros / 1_000_000);
    console.log("  Price range: $" + Math.min(...prices).toFixed(6), "to $" + Math.max(...prices).toFixed(6));
    console.log("  First:", new Date(observations[0].observedAt * 1000).toISOString());
    console.log("  Last:", new Date(observations[observations.length - 1].observedAt * 1000).toISOString());
  }

  console.log("\n=== Replay Test Complete ===");
}

testReplay().catch(error => {
  console.error("Replay test failed:", error);
  process.exit(1);
});
