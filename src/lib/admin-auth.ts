import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, isValidAdminPassword } from "@/lib/admin-token";

export { ADMIN_COOKIE, adminToken, isValidAdminPassword };

export async function isAdminAuthenticated() {
  const jar = await cookies();
  const expected = await adminToken();
  if (!expected) return false;
  return jar.get(ADMIN_COOKIE)?.value === expected;
}
