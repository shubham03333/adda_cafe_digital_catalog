"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, isAdminAuthenticated, isValidAdminPassword } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { settingsSchema } from "@/lib/validations";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!isValidAdminPassword(password)) {
    redirect("/staff?error=1");
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/staff");
}

export async function saveSettings(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/staff");
  const parsed = settingsSchema.safeParse({
    cafe_name: String(formData.get("cafe_name") ?? ""),
    google_review_url: String(formData.get("google_review_url") ?? ""),
    table_count: Number(formData.get("table_count") ?? 10),
  });

  if (!parsed.success) {
    redirect("/admin/settings?error=1");
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    redirect("/admin/settings?error=supabase");
  }

  await supabase.from("settings").upsert(
    {
      cafe_id: DEFAULT_CAFE_ID,
      cafe_name: parsed.data.cafe_name,
      google_review_url: parsed.data.google_review_url,
      table_count: parsed.data.table_count,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "cafe_id" }
  );

  redirect("/admin/settings?saved=1");
}
