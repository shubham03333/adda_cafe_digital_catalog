import { createServiceSupabase } from "@/lib/supabase/admin";

export type CatalogJunkPurgeCounts = {
  syncLog: number;
  analytics: number;
};

export async function purgeCatalogJunk(): Promise<CatalogJunkPurgeCounts> {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return { syncLog: 0, analytics: 0 };
  }

  const syncCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const analyticsCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const sync = await supabase.from("sync_log").delete({ count: "exact" }).lt("created_at", syncCutoff);
  const analytics = await supabase.from("analytics").delete({ count: "exact" }).lt("created_at", analyticsCutoff);

  if (sync.error && !/does not exist|schema cache/i.test(sync.error.message)) {
    console.warn("[junk-purge] sync_log", sync.error.message);
  }
  if (analytics.error) {
    console.warn("[junk-purge] analytics", analytics.error.message);
  }

  return {
    syncLog: sync.count ?? 0,
    analytics: analytics.count ?? 0,
  };
}
