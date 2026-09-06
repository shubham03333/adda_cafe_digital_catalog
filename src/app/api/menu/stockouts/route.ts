import { fetchPosStockoutIds } from "@/lib/pos-stockout";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ids = await fetchPosStockoutIds();
    return Response.json(
      { ids },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ ids: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
