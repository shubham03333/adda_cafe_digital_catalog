"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { CAFE_NAME } from "@/lib/branding";
import { getLiveMenu } from "@/lib/menu";
import { compactWaiterMenu } from "@/lib/ai/menu-context";
import { buildWaiterGuestContext } from "@/lib/ai/guest-context";
import { generateWaiterReply } from "@/lib/ai/waiter";
import { GeminiError } from "@/lib/ai/gemini";
import { trackEvent } from "@/lib/analytics";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import { posConfigured } from "@/lib/pos/config";
import { posFetch } from "@/lib/pos/client";
import type { CatalogOffer } from "@/lib/guest-offers";

const askSchema = z.object({
  sessionId: z.string().min(8).max(80),
  tableNumber: z.number().int().min(0).max(200).optional(),
  question: z.string().trim().min(1).max(500),
  voice: z.boolean().optional(),
  guestName: z.string().trim().max(80).optional(),
  guestPhone: z.string().trim().max(20).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["customer", "waiter"]),
        text: z.string().trim().max(400),
      })
    )
    .max(10)
    .default([]),
});

const RATE_LIMIT_REPLY =
  "Please wait a moment — I can only take a few questions at a time so I stay accurate.";

export async function askWaiter(input: unknown) {
  const parsed = askSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Please ask a short question about our cafe." };
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);
  const limited = rateLimit(`waiter:${parsed.data.sessionId}:${ip}`, 10, 60_000);
  if (!limited.ok) {
    await trackEvent("waiter_rate_limited", { sessionId: parsed.data.sessionId });
    return { ok: false as const, error: RATE_LIMIT_REPLY };
  }

  try {
    const [dishes, guest, offers] = await Promise.all([
      getLiveMenu({ overlayStockout: false }),
      buildWaiterGuestContext({ name: parsed.data.guestName, phone: parsed.data.guestPhone }),
      (async () => {
        if (!posConfigured()) return [] as { code: string; name: string; audience: string }[];
        try {
          const data = await posFetch<{ offers?: CatalogOffer[] }>("/api/integrations/offers");
          return (data.offers ?? [])
            .filter((offer) => offer.is_active)
            .slice(0, 8)
            .map((offer) => ({
              code: offer.code,
              name: offer.name,
              audience: offer.audience,
            }));
        } catch {
          return [];
        }
      })(),
    ]);

    const menu = compactWaiterMenu(dishes);
    if (!menu.length) {
      return { ok: false as const, error: "The menu is loading. Please try again in a moment." };
    }

    const reply = await generateWaiterReply({
      cafeName: CAFE_NAME,
      guest,
      menu,
      offers,
      history: parsed.data.history,
      question: parsed.data.question,
    });

    await trackEvent("waiter_question", {
      sessionId: parsed.data.sessionId,
      tableNumber: parsed.data.tableNumber ?? null,
      question: parsed.data.question.slice(0, 120),
      voice: Boolean(parsed.data.voice),
      language: reply.language,
      conversationLength: parsed.data.history.length + 1,
      spicy: /spic/i.test(parsed.data.question),
      budget: /₹|rs\.?|budget|cheap|under/i.test(parsed.data.question),
      prep: /prep|time|long|minut/i.test(parsed.data.question),
      recommended: reply.recommendations.map((item) => item.name),
      upsell: reply.upsell?.name ?? null,
    });

    return { ok: true as const, ...reply };
  } catch (error) {
    await trackEvent("waiter_error", {
      sessionId: parsed.data.sessionId,
      message: error instanceof Error ? error.message : "unknown",
    });
    const quota = error instanceof GeminiError && (error.status === 429 || error.status === 503);
    return {
      ok: false as const,
      error: quota
        ? "I'm a bit busy right now. Please wait a moment and ask again."
        : "I couldn't reach the kitchen just now. Please try again, or ask our staff.",
    };
  }
}

export async function trackWaiterView(dishName: string) {
  await trackEvent("waiter_view_dish", { dish: dishName.slice(0, 80) });
}
