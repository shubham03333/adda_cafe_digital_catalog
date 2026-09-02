import { NextRequest, NextResponse } from "next/server";
import { syncMenuFromPos } from "@/lib/pos/menu-sync";

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
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
