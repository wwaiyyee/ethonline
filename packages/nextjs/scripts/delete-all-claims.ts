import { getDb } from "../services/db/client";

/**
 * Delete ALL claims and evidence to start fresh
 * WARNING: This cannot be undone!
 */
function deleteAllClaims() {
  const db = getDb();

  console.log("=== DELETING ALL CLAIMS ===\n");

  // Count before deletion
  const claimCount = db.prepare("SELECT COUNT(*) as count FROM claims").get() as { count: number };
  const evidenceCount = db.prepare("SELECT COUNT(*) as count FROM evidence").get() as { count: number };
  const approvalCount = db.prepare("SELECT COUNT(*) as count FROM approvals").get() as { count: number };

  console.log(`Found:`);
  console.log(`  ${claimCount.count} claims`);
  console.log(`  ${evidenceCount.count} evidence records`);
  console.log(`  ${approvalCount.count} approvals`);
  console.log("");

  // Delete in order (foreign keys)
  console.log("Deleting approvals...");
  db.prepare("DELETE FROM approvals").run();

  console.log("Deleting evidence...");
  db.prepare("DELETE FROM evidence").run();

  console.log("Deleting claims...");
  db.prepare("DELETE FROM claims").run();

  console.log("\n✓ All claims, evidence, and approvals deleted!");
  console.log("\nDatabase is now clean. Run process-all-claims.ts to start fresh.");
}

deleteAllClaims();
