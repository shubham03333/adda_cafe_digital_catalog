import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";

function startOfTodayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export type DashboardStats = {
  todayVisitors: number;
  averageRating: number;
  feedbackCount: number;
  generationCount: number;
  generationSuccess: number;
  generationFailed: number;
  topItems: { name: string; count: number }[];
  funnel: {
    qrScans: number;
    ratings: number;
    copies: number;
    googleClicks: number;
  };
  daily: { day: string; scans: number; ratings: number; copies: number }[];
  mostSelectedReview: string | null;
  positiveRatings: number;
  negativeRatings: number;
};

const emptyStats: DashboardStats = {
  todayVisitors: 0,
  averageRating: 0,
  feedbackCount: 0,
  generationCount: 0,
  generationSuccess: 0,
  generationFailed: 0,
  topItems: [],
  funnel: { qrScans: 0, ratings: 0, copies: 0, googleClicks: 0 },
  daily: [],
  mostSelectedReview: null,
  positiveRatings: 0,
  negativeRatings: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServiceSupabase();
  if (!supabase) return emptyStats;

  const today = startOfTodayIso();
  const week = daysAgoIso(7);

  const [
    scansToday,
    gensToday,
    failToday,
    allRatings,
    feedbackAll,
    sessions,
    analyticsWeek,
  ] = await Promise.all([
    supabase.from("analytics").select("id", { count: "exact", head: true }).eq("cafe_id", DEFAULT_CAFE_ID).eq("event_type", "qr_scan").gte("created_at", today),
    supabase.from("analytics").select("id", { count: "exact", head: true }).eq("cafe_id", DEFAULT_CAFE_ID).eq("event_type", "review_generated").gte("created_at", today),
    supabase.from("analytics").select("id", { count: "exact", head: true }).eq("cafe_id", DEFAULT_CAFE_ID).eq("event_type", "review_generation_failed").gte("created_at", today),
    supabase.from("ratings").select("stars").eq("cafe_id", DEFAULT_CAFE_ID),
    supabase.from("feedback").select("id", { count: "exact", head: true }).eq("cafe_id", DEFAULT_CAFE_ID),
    supabase.from("review_sessions").select("ordered_items, selected_review_text, selected_review_index").eq("cafe_id", DEFAULT_CAFE_ID),
    supabase.from("analytics").select("event_type, created_at").eq("cafe_id", DEFAULT_CAFE_ID).gte("created_at", week),
  ]);

  const ratingRows = allRatings.data ?? [];
  const averageRating =
    ratingRows.length === 0
      ? 0
      : ratingRows.reduce((sum, row) => sum + (row.stars as number), 0) / ratingRows.length;

  const itemCounts = new Map<string, number>();
  const reviewCounts = new Map<string, number>();
  for (const session of sessions.data ?? []) {
    for (const item of (session.ordered_items as string[] | null) ?? []) {
      itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
    }
    if (session.selected_review_text) {
      const text = String(session.selected_review_text);
      reviewCounts.set(text, (reviewCounts.get(text) ?? 0) + 1);
    }
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const mostSelectedReview =
    [...reviewCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const events = analyticsWeek.data ?? [];
  const funnel = {
    qrScans: events.filter((e) => e.event_type === "qr_scan").length,
    ratings: events.filter((e) => e.event_type === "rating").length,
    copies: events.filter((e) => e.event_type === "copy_click").length,
    googleClicks: events.filter((e) => e.event_type === "google_click").length,
  };

  const dailyMap = new Map<string, { scans: number; ratings: number; copies: number }>();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    dailyMap.set(key, { scans: 0, ratings: 0, copies: 0 });
  }
  for (const event of events) {
    const key = String(event.created_at).slice(0, 10);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    if (event.event_type === "qr_scan") bucket.scans += 1;
    if (event.event_type === "rating") bucket.ratings += 1;
    if (event.event_type === "copy_click") bucket.copies += 1;
  }

  return {
    todayVisitors: scansToday.count ?? 0,
    averageRating: Number(averageRating.toFixed(2)),
    feedbackCount: feedbackAll.count ?? 0,
    generationCount: gensToday.count ?? 0,
    generationSuccess: gensToday.count ?? 0,
    generationFailed: failToday.count ?? 0,
    topItems,
    funnel,
    daily: [...dailyMap.entries()].map(([day, value]) => ({ day, ...value })),
    mostSelectedReview,
    positiveRatings: ratingRows.filter((r) => (r.stars as number) >= 4).length,
    negativeRatings: ratingRows.filter((r) => (r.stars as number) <= 3).length,
  };
}

export async function getSettings() {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return {
      cafe_name: "Adda",
      google_review_url: "",
      table_count: 10,
      table_map: {},
    };
  }
  const { data, error } = await supabase
    .from("settings")
    .select("cafe_name, google_review_url, table_count, table_map")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .maybeSingle();
  if (error) {
    const fallback = await supabase
      .from("settings")
      .select("cafe_name, google_review_url, table_count")
      .eq("cafe_id", DEFAULT_CAFE_ID)
      .maybeSingle();
    return {
      cafe_name: fallback.data?.cafe_name ?? "Adda",
      google_review_url: fallback.data?.google_review_url ?? "",
      table_count: fallback.data?.table_count ?? 10,
      table_map: {},
    };
  }
  return {
    cafe_name: data?.cafe_name ?? "Adda",
    google_review_url: data?.google_review_url ?? "",
    table_count: data?.table_count ?? 10,
    table_map: (data?.table_map as Record<string, string> | null) ?? {},
  };
}
