import { createServiceSupabase } from "@/lib/supabase/admin";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import type { AnalyticsEvent } from "@/types";

type TrackPayload = Record<string, unknown>;

export async function trackEvent(
  event: AnalyticsEvent,
  payload: TrackPayload = {},
  cafeId = DEFAULT_CAFE_ID
) {
  const row = {
    cafe_id: cafeId,
    event_type: event,
    payload,
  };

  const service = createServiceSupabase();
  if (service) {
    await service.from("analytics").insert(row);
    return;
  }

  const browser = createBrowserSupabase();
  if (browser) {
    await browser.from("analytics").insert(row);
  }
}
