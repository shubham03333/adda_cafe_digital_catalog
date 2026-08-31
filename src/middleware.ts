import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-token";
import { applySecurityHeaders, getClientIp } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const BLOCKED = [
  "/.env",
  "/.git",
  "/wp-admin",
  "/wp-login",
  "/xmlrpc.php",
  "/phpmyadmin",
  "/.aws",
  "/config.json",
];

function withHeaders(request: NextRequest, response: NextResponse) {
  const headers = applySecurityHeaders(response, request.nextUrl.origin);
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request.headers);

  if (BLOCKED.some((path) => pathname.toLowerCase().startsWith(path))) {
    return withHeaders(request, new NextResponse("Not found", { status: 404 }));
  }

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    const globalLimit = rateLimit(`post:${ip}`, 80, 60_000);
    if (!globalLimit.ok) {
      return withHeaders(
        request,
        new NextResponse("Too many requests", {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((globalLimit.retryAfterMs ?? 60000) / 1000)) },
        })
      );
    }
  }

  if (pathname === "/api/admin/login" && request.method === "POST") {
    const loginLimit = rateLimit(`login:${ip}`, 5, 15 * 60_000);
    if (!loginLimit.ok) {
      const origin = request.nextUrl.origin;
      return withHeaders(
        request,
        NextResponse.redirect(new URL("/staff?error=locked", origin), 303)
      );
    }
  }

  if (pathname.startsWith("/admin")) {
    const token = await adminToken();
    if (!token || request.cookies.get(ADMIN_COOKIE)?.value !== token) {
      return withHeaders(request, NextResponse.redirect(new URL("/staff", request.url)));
    }
  }

  return withHeaders(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
