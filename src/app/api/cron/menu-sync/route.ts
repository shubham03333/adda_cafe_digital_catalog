import { NextRequest, NextResponse } from "next/server";
import { syncMenuFromPos } from "@/lib/pos/menu-sync";
import { purgeCatalogJunk } from "@/lib/junk-purge";

function authorized(request: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncMenuFromPos();
  const purged = await purgeCatalogJunk().catch((error) => {
    console.warn("[cron] catalog junk purge failed", error);
    return { syncLog: 0, analytics: 0 };
  });
  return NextResponse.json({ ...result, purged }, { status: result.ok ? 200 : 502 });
}
