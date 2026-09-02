"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { syncMenuFromPos } from "@/lib/pos/menu-sync";

export async function triggerMenuSync() {
  if (!(await isAdminAuthenticated())) redirect("/staff");
  const result = await syncMenuFromPos();
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/review");
  return result;
}
