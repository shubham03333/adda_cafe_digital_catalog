"use server";

import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { sendGuestEmail } from "@/lib/guest-email";
import {
  hashOtp,
  hashPassword,
  isValidPhone,
  makeOtp,
  normalizePhone,
  verifyPassword,
} from "@/lib/guest-crypto";
import { type GuestProfile } from "@/lib/guest-profile";

function mapGuest(row: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  email_verified?: boolean;
  date_of_birth?: string | null;
}): GuestProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? null,
    emailVerified: Boolean(row.email_verified),
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : null,
  };
}

export async function continueWithPhone(input: {
  name: string;
  phone: string;
  dateOfBirth?: string;
  offersOptIn?: boolean;
}) {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  if (name.length < 2) return { ok: false as const, error: "Enter your name." };
  if (!isValidPhone(phone)) return { ok: false as const, error: "Enter a valid 10-digit mobile number." };
  const dob =
    input.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth) ? input.dateOfBirth : null;
  const offersOptIn = Boolean(input.offersOptIn);

  const supabase = createServiceSupabase();
  if (!supabase) {
    return {
      ok: true as const,
      guest: { id: `local-${phone}`, name, phone, email: null, emailVerified: false, dateOfBirth: dob },
    };
  }

  const { data: existing } = await supabase
    .from("guest_customers")
    .select("id, name, phone, email, email_verified, date_of_birth")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = { name, updated_at: new Date().toISOString() };
    if (dob) patch.date_of_birth = dob;
    if (offersOptIn) patch.offers_opt_in = true;
    await supabase.from("guest_customers").update(patch).eq("id", existing.id);
    return { ok: true as const, guest: mapGuest({ ...existing, name, date_of_birth: dob || (existing as { date_of_birth?: string | null }).date_of_birth }) };
  }

  const insert: Record<string, unknown> = { cafe_id: DEFAULT_CAFE_ID, phone, name, offers_opt_in: offersOptIn };
  if (dob) insert.date_of_birth = dob;
  const { data, error } = await supabase
    .from("guest_customers")
    .insert(insert)
    .select("id, name, phone, email, email_verified, date_of_birth")
    .single();
  if (error || !data) return { ok: false as const, error: "Could not save your number. Try again." };
  return { ok: true as const, guest: mapGuest({ ...data, date_of_birth: dob || (data as { date_of_birth?: string | null }).date_of_birth }) };
}

export async function startEmailOtp(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
  mode: "signup" | "forgot";
}) {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false as const, error: "Enter your name." };
  if (!isValidPhone(phone)) return { ok: false as const, error: "Enter a valid 10-digit mobile number." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false as const, error: "Enter a valid email." };
  if (input.mode === "signup" && input.password.length < 6) {
    return { ok: false as const, error: "Password must be at least 6 characters." };
  }

  const supabase = createServiceSupabase();
  if (!supabase) return { ok: false as const, error: "Customer save is not configured." };

  const { data: emailOwner } = await supabase
    .from("guest_customers")
    .select("id, phone, email_verified")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("email", email)
    .eq("email_verified", true)
    .maybeSingle();
  if (emailOwner && emailOwner.phone !== phone) {
    return { ok: false as const, error: "This email is already attached to another mobile number." };
  }

  const continued = await continueWithPhone({ name, phone });
  if (!continued.ok) return continued;

  const otp = makeOtp();
  const patch: Record<string, unknown> = {
    email,
    email_otp: hashOtp(otp),
    email_otp_expires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (input.mode === "signup") patch.password_hash = hashPassword(input.password);

  await supabase.from("guest_customers").update(patch).eq("id", continued.guest.id);

  const mailed = await sendGuestEmail(
    email,
    input.mode === "forgot" ? "Adda Cafe password reset" : "Adda Cafe email verification",
    `Your Adda Cafe code is ${otp}. It expires in 10 minutes.`
  );
  if (!mailed.ok) return { ok: false as const, error: mailed.error };

  return {
    ok: true as const,
    guestId: continued.guest.id,
    phone: continued.guest.phone,
    debugOtp: mailed.mocked ? otp : undefined,
  };
}

export async function verifyEmailOtp(input: { phone: string; otp: string }) {
  const phone = normalizePhone(input.phone);
  const otp = input.otp.trim();
  const supabase = createServiceSupabase();
  if (!supabase) return { ok: false as const, error: "Customer save is not configured." };

  const { data } = await supabase
    .from("guest_customers")
    .select("id, name, phone, email, email_verified, email_otp, email_otp_expires, date_of_birth")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("phone", phone)
    .maybeSingle();
  if (!data?.email_otp || !data.email_otp_expires) {
    return { ok: false as const, error: "No email code found. Request a new one." };
  }
  if (new Date(data.email_otp_expires).getTime() < Date.now()) {
    return { ok: false as const, error: "That code expired. Request a new one." };
  }
  if (hashOtp(otp) !== data.email_otp) return { ok: false as const, error: "Wrong code. Try again." };

  await supabase
    .from("guest_customers")
    .update({
      email_verified: true,
      email_otp: null,
      email_otp_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return { ok: true as const, guest: mapGuest({ ...data, email_verified: true }) };
}

export async function loginWithEmail(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const supabase = createServiceSupabase();
  if (!supabase) return { ok: false as const, error: "Customer save is not configured." };

  const { data } = await supabase
    .from("guest_customers")
    .select("id, name, phone, email, email_verified, password_hash, date_of_birth")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("email", email)
    .eq("email_verified", true)
    .maybeSingle();
  if (!data?.password_hash) return { ok: false as const, error: "No email account found. Create one first." };
  if (!verifyPassword(input.password, data.password_hash)) {
    return { ok: false as const, error: "Wrong email or password." };
  }
  return { ok: true as const, guest: mapGuest(data) };
}

export async function startForgotEmail(input: { email: string }) {
  const email = input.email.trim().toLowerCase();
  const supabase = createServiceSupabase();
  if (!supabase) return { ok: false as const, error: "Customer save is not configured." };
  const { data } = await supabase
    .from("guest_customers")
    .select("id, name, phone")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .eq("email", email)
    .eq("email_verified", true)
    .maybeSingle();
  if (!data) return { ok: false as const, error: "No verified email account found." };
  return startEmailOtp({
    name: data.name,
    phone: data.phone,
    email,
    password: "",
    mode: "forgot",
  });
}

export async function resetPasswordWithOtp(input: { phone: string; otp: string; password: string }) {
  const verified = await verifyEmailOtp({ phone: input.phone, otp: input.otp });
  if (!verified.ok) return verified;
  if (input.password.length < 6) return { ok: false as const, error: "Password must be at least 6 characters." };
  const supabase = createServiceSupabase();
  if (!supabase) return { ok: false as const, error: "Customer save is not configured." };
  await supabase
    .from("guest_customers")
    .update({
      password_hash: hashPassword(input.password),
      updated_at: new Date().toISOString(),
    })
    .eq("id", verified.guest.id);
  return { ok: true as const, guest: verified.guest };
}
