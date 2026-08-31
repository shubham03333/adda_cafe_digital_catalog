"use server";

import { headers } from "next/headers";
import { trackEvent } from "@/lib/analytics";
import { generateReviewSuggestions } from "@/lib/ai/gemini";
import { CAFE_NAME } from "@/lib/branding";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { DEFAULT_CAFE_ID } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import {
  feedbackSchema,
  generateReviewsSchema,
  ratingSchema,
  selectReviewSchema,
} from "@/lib/validations";

async function getSettings() {
  const supabase = createServiceSupabase();
  if (!supabase) {
    return {
      cafe_name: CAFE_NAME,
      google_review_url: "",
    };
  }
  const { data } = await supabase
    .from("settings")
    .select("cafe_name, google_review_url")
    .eq("cafe_id", DEFAULT_CAFE_ID)
    .maybeSingle();
  return {
    cafe_name: data?.cafe_name ?? CAFE_NAME,
    google_review_url: data?.google_review_url ?? "",
  };
}

export async function recordQrScan(tableNumber?: number | null) {
  await trackEvent("qr_scan", { tableNumber: tableNumber ?? null });
}

export async function submitRating(input: unknown) {
  const parsed = ratingSchema.parse(input);
  const supabase = createServiceSupabase();

  if (supabase) {
    await supabase.from("ratings").insert({
      cafe_id: DEFAULT_CAFE_ID,
      session_id: parsed.sessionId,
      table_number: parsed.tableNumber ?? null,
      stars: parsed.stars,
    });

    await supabase.from("review_sessions").upsert(
      {
        id: parsed.sessionId,
        cafe_id: DEFAULT_CAFE_ID,
        table_number: parsed.tableNumber ?? null,
        rating: parsed.stars,
      },
      { onConflict: "id" }
    );
  }

  await trackEvent("rating", {
    sessionId: parsed.sessionId,
    stars: parsed.stars,
    sentiment: parsed.stars >= 4 ? "positive" : "negative",
    tableNumber: parsed.tableNumber ?? null,
  });

  return { ok: true as const };
}

export async function submitPrivateFeedback(input: unknown) {
  const parsed = feedbackSchema.parse(input);
  const supabase = createServiceSupabase();

  if (supabase) {
    await supabase.from("feedback").insert({
      cafe_id: DEFAULT_CAFE_ID,
      session_id: parsed.sessionId,
      table_number: parsed.tableNumber ?? null,
      message: parsed.message,
    });
  }

  await trackEvent("feedback_submitted", {
    sessionId: parsed.sessionId,
    rating: parsed.rating,
  });

  const settings = await getSettings();
  return { ok: true as const, googleReviewUrl: settings.google_review_url };
}

export async function generateReviews(input: unknown) {
  const parsed = generateReviewsSchema.parse(input);
  const ip = getClientIp(await headers());
  const limited = rateLimit(`generate:${ip}`, 8, 10 * 60_000);
  const sessionLimited = rateLimit(`generate-session:${parsed.sessionId}`, 5, 60 * 60_000);
  if (!limited.ok || !sessionLimited.ok) {
    const settingsLimited = await getSettings();
    return {
      ok: false as const,
      error: "Too many review requests. Please wait a few minutes and try again.",
      googleReviewUrl: settingsLimited.google_review_url,
    };
  }
  const settings = await getSettings();

  try {
    const reviews = await generateReviewSuggestions({
      cafeName: settings.cafe_name,
      rating: parsed.rating,
      orderedItems: parsed.orderedItems,
      service: parsed.service,
      recommend: parsed.recommend,
      language: parsed.language,
    });

    const supabase = createServiceSupabase();
    if (supabase) {
      await supabase.from("review_sessions").upsert(
        {
          id: parsed.sessionId,
          cafe_id: DEFAULT_CAFE_ID,
          table_number: parsed.tableNumber ?? null,
          rating: parsed.rating,
          ordered_items: parsed.orderedItems,
          service: parsed.service ?? null,
          recommend: parsed.recommend ?? null,
          language: parsed.language,
          generated_reviews: reviews,
        },
        { onConflict: "id" }
      );
    }

    await trackEvent("review_generated", {
      sessionId: parsed.sessionId,
      count: reviews.length,
      language: parsed.language,
    });

    return {
      ok: true as const,
      reviews,
      googleReviewUrl: settings.google_review_url,
    };
  } catch (error) {
    await trackEvent("review_generation_failed", {
      sessionId: parsed.sessionId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false as const,
      error:
        "We could not generate reviews right now. You can still open Google Reviews and write in your own words.",
      googleReviewUrl: settings.google_review_url,
    };
  }
}

export async function recordReviewAction(input: unknown) {
  const parsed = selectReviewSchema.parse(input);
  const supabase = createServiceSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    await supabase
      .from("review_sessions")
      .update({
        selected_review_index: parsed.reviewIndex,
        selected_review_text: parsed.reviewText,
        copied_at: now,
        google_clicked_at: parsed.action === "use" ? now : undefined,
      })
      .eq("id", parsed.sessionId);
  }

  await trackEvent("review_selected", {
    sessionId: parsed.sessionId,
    reviewIndex: parsed.reviewIndex,
  });
  await trackEvent("copy_click", {
    sessionId: parsed.sessionId,
    reviewIndex: parsed.reviewIndex,
  });

  if (parsed.action === "use") {
    await trackEvent("use_review", {
      sessionId: parsed.sessionId,
      reviewIndex: parsed.reviewIndex,
    });
    await trackEvent("google_click", { sessionId: parsed.sessionId });
  }

  const settings = await getSettings();
  return { ok: true as const, googleReviewUrl: settings.google_review_url };
}

export async function recordGoogleClick(sessionId: string) {
  await trackEvent("google_click", { sessionId });
  const settings = await getSettings();
  return { googleReviewUrl: settings.google_review_url };
}
