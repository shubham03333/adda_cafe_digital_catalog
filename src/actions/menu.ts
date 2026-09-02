"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { isPosMenuSync } from "@/lib/pos/config";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/staff");
}

function parseItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const price = Number(formData.get("price"));
  const rating = Number(formData.get("rating"));
  const popular = formData.get("popular") === "on";
  const available = formData.get("available") === "on";
  if (name.length > 80 || category.length > 40 || description.length > 500) {
    throw new Error("Dish fields are too long");
  }
  if (!name || !category || Number.isNaN(price) || price < 0 || price > 100000) {
    throw new Error("Name, category, and a valid price are required");
  }
  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    throw new Error("Rating must be between 0 and 5");
  }
  return { name, description, category, price, rating, popular, available };
}

async function uploadPhoto(file: File | null) {
  if (!file || file.size === 0) return null;
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    throw new Error("Photo must be a JPEG, PNG, WebP, or GIF");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Photo must be under 4MB");
  }
  const supabase = createServiceSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const path = `${DEFAULT_CAFE_ID}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from("menu-photos").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("menu-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function saveMenuItem(formData: FormData) {
  await requireAdmin();
  const supabase = createServiceSupabase();
  if (!supabase) {
    return { ok: false as const, error: "Add Supabase keys, then run supabase/schema.sql including the menu_items table." };
  }

  try {
    const parsed = parseItem(formData);
    const id = String(formData.get("id") ?? "").trim();
    if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
      return { ok: false as const, error: "Invalid dish id" };
    }
    const photo = formData.get("photo");
    const file = photo instanceof File ? photo : null;
    const uploaded = await uploadPhoto(file);
    const image = uploaded || String(formData.get("image") ?? "").trim();
    if (image && !image.startsWith("/") && !/^https:\/\//i.test(image)) {
      return { ok: false as const, error: "Invalid photo URL" };
    }

    const row = isPosMenuSync()
      ? {
          rating: parsed.rating,
          popular: parsed.popular,
          image,
          updated_at: new Date().toISOString(),
        }
      : {
          cafe_id: DEFAULT_CAFE_ID,
          ...parsed,
          image,
          updated_at: new Date().toISOString(),
        };

    if (id) {
      const { error } = await supabase.from("menu_items").update(row).eq("id", id).eq("cafe_id", DEFAULT_CAFE_ID);
      if (error) return { ok: false as const, error: error.message };
    } else {
      if (isPosMenuSync()) {
        return { ok: false as const, error: "Operational menu is managed in POS. Sync, then edit photos or ratings here." };
      }
      const { count } = await supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("cafe_id", DEFAULT_CAFE_ID);
      const { error } = await supabase.from("menu_items").insert({
        cafe_id: DEFAULT_CAFE_ID,
        ...parsed,
        image,
        sort_order: (count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      });
      if (error) return { ok: false as const, error: error.message };
    }

    revalidatePath("/admin/menu");
    revalidatePath("/menu");
    revalidatePath("/review");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Could not save dish" };
  }
}

export async function deleteMenuItem(id: string) {
  await requireAdmin();
  if (isPosMenuSync()) {
    return { ok: false as const, error: "Dishes are managed in POS. Hide them there, then sync." };
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { ok: false as const, error: "Invalid dish id" };
  }
  const supabase = createServiceSupabase();
  if (!supabase) return { ok: false as const, error: "Supabase is not configured" };
  const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("cafe_id", DEFAULT_CAFE_ID);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/review");
  return { ok: true as const };
}
