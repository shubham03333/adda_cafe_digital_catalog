import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { uploadMenuPhoto } from "@/lib/menu-photo";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const file = photo instanceof File ? photo : null;
    if (!file) {
      return NextResponse.json({ error: "Choose a photo first." }, { status: 400 });
    }
    const result = await uploadMenuPhoto(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
