import { getLiveMenu } from "@/lib/menu";

export const dynamic = "force-dynamic";

function absoluteImage(image: string, origin: string) {
  const value = String(image || "").trim();
  if (!value || value === "/adda.png") return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return null;
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const dishes = await getLiveMenu({ overlayStockout: false });
  const photos: Record<string, string> = {};
  for (const dish of dishes) {
    const posId = Number(dish.posMenuItemId);
    if (!Number.isInteger(posId) || posId < 1) continue;
    const url = absoluteImage(dish.image, origin);
    if (url) photos[String(posId)] = url;
  }
  return Response.json(
    { photos, count: Object.keys(photos).length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
