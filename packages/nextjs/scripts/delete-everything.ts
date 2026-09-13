import { getDb } from "../services/db/client";

/**
 * Delete ALL policies, claims, evidence, approvals, and observations
 * Complete database reset - start completely fresh
 * WARNING: This cannot be undone!
 */
function deleteEverything() {
  const db = getDb();

  console.log("=== DELETING EVERYTHING ===\n");

  // Count before deletion
  const counts = {
    claims: db.prepare("SELECT COUNT(*) as count FROM claims").get() as { count: number },
    evidence: db.prepare("SELECT COUNT(*) as count FROM evidence").get() as { count: number },
    approvals: db.prepare("SELECT COUNT(*) as count FROM approvals").get() as { count: number },
    policies: db.prepare("SELECT COUNT(*) as count FROM policies").get() as { count: number },
    observations: db.prepare("SELECT COUNT(*) as count FROM observations").get() as { count: number },
  };

  console.log(`Found:`);
  console.log(`  ${counts.claims.count} claims`);
  console.log(`  ${counts.evidence.count} evidence records`);
  console.log(`  ${counts.approvals.count} approvals`);
  console.log(`  ${counts.policies.count} policies`);
  console.log(`  ${counts.observations.count} market observations`);
  console.log("");

  // Delete in order (respecting foreign keys)
  console.log("Deleting approvals...");
  db.prepare("DELETE FROM approvals").run();

  console.log("Deleting evidence...");
  db.prepare("DELETE FROM evidence").run();

  console.log("Deleting claims...");
  db.prepare("DELETE FROM claims").run();

  console.log("Deleting observations...");
  db.prepare("DELETE FROM observations").run();

  console.log("Deleting policies...");
  db.prepare("DELETE FROM policies").run();

  console.log("\n✓ Complete database reset!");
  console.log("\nAll data deleted. You can now:");
  console.log("  1. Create new policies via the UI or scripts");
  console.log("  2. Run process-all-claims.ts to start fresh");
}

deleteEverything();
