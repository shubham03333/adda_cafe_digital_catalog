import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";

export function tableCodeFromNumber(tableNumber: number, tableMap: Record<string, string> = {}) {
  const fromEnv = process.env.TABLE_NUMBER_TO_CODE;
  let envMap: Record<string, string> = {};
  if (fromEnv) {
    try {
      envMap = JSON.parse(fromEnv) as Record<string, string>;
    } catch {
      envMap = {};
    }
  }
  const key = String(tableNumber);
  return envMap[key] || tableMap[key] || key;
}

export async function getTableMap() {
  const supabase = createServiceSupabase();
  if (!supabase) return {} as Record<string, string>;
  const { data } = await supabase
    .from("settings")
    .select("table_map")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .maybeSingle();
  const map = data?.table_map;
  if (map && typeof map === "object" && !Array.isArray(map)) {
    return map as Record<string, string>;
  }
  return {};
}
