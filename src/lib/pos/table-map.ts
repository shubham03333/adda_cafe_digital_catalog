import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { posFetch } from "@/lib/pos/client";

function numericTable(code: string) {
  const digits = String(code).trim().replace(/^[A-Za-z]+/, "");
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

function paddedPosCode(tableNumber: number) {
  return `T${String(tableNumber).padStart(2, "0")}`;
}

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
  return envMap[key] || tableMap[key] || paddedPosCode(tableNumber);
}

export async function resolvePosTableCode(tableNumber: number) {
  const mapped = tableCodeFromNumber(tableNumber, await getTableMap());
  try {
    const data = await posFetch<{ tables: { table_code: string }[] }>("/api/integrations/tables");
    const tables = data.tables ?? [];
    const exact = tables.find(
      (table) =>
        table.table_code === mapped ||
        table.table_code === String(tableNumber) ||
        table.table_code === paddedPosCode(tableNumber)
    );
    if (exact) return exact.table_code;
    const byNumber = tables.find((table) => numericTable(table.table_code) === tableNumber);
    if (byNumber) return byNumber.table_code;
  } catch {
    return mapped;
  }
  return mapped;
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
