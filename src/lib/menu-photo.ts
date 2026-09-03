import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/webp", "image/gif"]);

function extFor(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".gif")) return "gif";
  return "jpg";
}

export async function uploadMenuPhoto(file: File) {
  if (!file || file.size === 0) {
    return { ok: false as const, error: "Choose a photo first." };
  }
  const type = (file.type || "").toLowerCase();
  const named = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
  if (type && !ALLOWED.has(type) && !named) {
    return { ok: false as const, error: "Use a JPEG, PNG, WebP, or GIF photo." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { ok: false as const, error: "Photo must be under 4MB." };
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return { ok: false as const, error: "Supabase is not configured." };
  }

  const ext = extFor(file);
  const path = `${DEFAULT_CAFE_ID}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = ALLOWED.has(type) ? file.type : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";

  const { error } = await supabase.storage.from("menu-photos").upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    return { ok: false as const, error: error.message || "Could not upload photo. Create the menu-photos bucket in Supabase Storage." };
  }

  const { data } = supabase.storage.from("menu-photos").getPublicUrl(path);
  if (!data?.publicUrl) {
    return { ok: false as const, error: "Upload succeeded but no public URL was returned." };
  }
  return { ok: true as const, url: data.publicUrl };
}
