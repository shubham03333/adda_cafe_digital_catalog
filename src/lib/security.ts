export function getClientIp(headersList: Headers) {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headersList.get("x-real-ip") || headersList.get("cf-connecting-ip") || "unknown";
}

export async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function isSameOrigin(request: Request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) return origin === url.origin;
  if (process.env.NODE_ENV === "production") return false;
  const referer = request.headers.get("referer");
  if (!referer) return true;
  try {
    return new URL(referer).origin === url.origin;
  } catch {
    return false;
  }
}

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-DNS-Prefetch-Control": "off",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
  ].join("; "),
};

export function applySecurityHeaders(response: Response, requestUrl?: string) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  if (requestUrl?.startsWith("https://")) {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return headers;
}
