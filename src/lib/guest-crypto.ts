import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function normalizePhone(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isValidPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type { GuestProfile } from "@/lib/guest-profile";
export { GUEST_STORAGE_KEY } from "@/lib/guest-profile";
