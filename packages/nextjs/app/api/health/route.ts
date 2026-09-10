import { NextResponse } from "next/server";
import { getDb } from "~~/services/db/client";

export const runtime = "nodejs";
export async function GET() {
  const database = getDb();
  const row = database.prepare("SELECT COUNT(*) as count FROM schema_migrations").get() as { count: number };
  return NextResponse.json({
    status: "ok",
    service: "edgraph",
    database: "ok",
    migrations: row.count,
    network: process.env.X402_NETWORK ?? "hedera:testnet",
  });
}
