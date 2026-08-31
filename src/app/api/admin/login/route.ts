import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, isValidAdminPassword } from "@/lib/admin-token";
import { isSameOrigin } from "@/lib/security";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  return new NextResponse("Method not allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 8192) {
    return NextResponse.redirect(new URL("/staff?error=1", origin), 303);
  }
  if (!isSameOrigin(request)) {
    return NextResponse.redirect(new URL("/staff?error=1", origin), 303);
  }

  const form = await request.formData();
  const honeypot = String(form.get("website") ?? "");
  const password = String(form.get("password") ?? "");

  await sleep(250);

  if (honeypot || !isValidAdminPassword(password)) {
    await sleep(500);
    return NextResponse.redirect(new URL("/staff?error=1", origin), 303);
  }

  const response = NextResponse.redirect(new URL("/admin", origin), 303);
  response.cookies.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
