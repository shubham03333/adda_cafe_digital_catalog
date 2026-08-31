import { sha256Hex } from "@/lib/security";

export const ADMIN_COOKIE = "adda_admin";

export async function adminToken() {
  const password = (process.env.ADMIN_PASSWORD ?? "").trim();
  const salt = (process.env.ADMIN_COOKIE_SECRET ?? "adda-v1").trim();
  if (!password) return "";
  const hash = await sha256Hex(`session:${password}:${salt}`);
  return `adda.${hash}`;
}

export function isValidAdminPassword(password: string) {
  const expected = (process.env.ADMIN_PASSWORD ?? "").trim();
  const given = password.trim();
  if (!expected || given.length === 0 || given.length > 256) return false;
  const max = Math.max(expected.length, given.length);
  let mismatch = expected.length ^ given.length;
  for (let i = 0; i < max; i += 1) {
    mismatch |= (given.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}
