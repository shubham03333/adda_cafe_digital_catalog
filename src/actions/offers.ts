"use server";

import { posConfigured } from "@/lib/pos/config";
import { posFetch, PosApiError } from "@/lib/pos/client";
import { isValidPhone, normalizePhone } from "@/lib/guest-crypto";
import {
  applyCatalogOffer,
  guestCanUseOffer,
  isBirthdayToday,
  isFullyRegistered,
  normalizeOfferCode,
  offerHeadline,
  type CatalogOffer,
  type OfferLine,
} from "@/lib/guest-offers";

export type GuestOfferCard = CatalogOffer & {
  headline: string;
  savings: number;
  locked: boolean;
  lockReason: string | null;
};

export async function listGuestOffers(input: {
  phone: string;
  email?: string | null;
  emailVerified?: boolean;
  dateOfBirth?: string | null;
  items: OfferLine[];
}) {
  if (!posConfigured()) return { ok: true as const, offers: [] as GuestOfferCard[], birthday: false };
  const phone = normalizePhone(input.phone);
  if (!isValidPhone(phone)) return { ok: false as const, error: "Enter a valid mobile number.", offers: [] as GuestOfferCard[] };

  try {
    const data = await posFetch<{ offers?: CatalogOffer[] }>(
      `/api/integrations/offers?phone=${encodeURIComponent(phone)}`
    );
    const guest = {
      phone,
      email: input.email,
      emailVerified: Boolean(input.emailVerified),
      dateOfBirth: input.dateOfBirth,
    };
    const birthday = isBirthdayToday(guest.dateOfBirth);
    const offers = (data.offers || []).map((offer) => {
      const access = guestCanUseOffer(offer, guest);
      const applied = applyCatalogOffer(input.items, offer);
      return {
        ...offer,
        headline: offerHeadline(offer),
        savings: applied.ok ? applied.discount : 0,
        locked: !access.ok,
        lockReason: access.ok ? null : access.reason,
      };
    });

    offers.sort((a, b) => {
      if (a.audience === "birthday" && b.audience !== "birthday") return -1;
      if (b.audience === "birthday" && a.audience !== "birthday") return 1;
      if (a.locked !== b.locked) return a.locked ? 1 : -1;
      return b.savings - a.savings;
    });

    return { ok: true as const, offers, birthday, registered: isFullyRegistered(guest) };
  } catch (error) {
    const message = error instanceof PosApiError ? error.message : "Could not load offers.";
    return { ok: false as const, error: message, offers: [] as GuestOfferCard[] };
  }
}

export async function previewGuestOffer(input: {
  code: string;
  phone: string;
  email?: string | null;
  emailVerified?: boolean;
  dateOfBirth?: string | null;
  items: OfferLine[];
}) {
  const listed = await listGuestOffers(input);
  if (!listed.ok) return listed;
  const code = normalizeOfferCode(input.code);
  const offer = listed.offers.find((row) => row.code === code);
  if (!offer) return { ok: false as const, error: "Unknown offer code" };
  if (offer.locked) return { ok: false as const, error: offer.lockReason || "This code is not available for you" };
  const applied = applyCatalogOffer(input.items, offer);
  if (!applied.ok) return { ok: false as const, error: applied.error };
  return {
    code: offer.code,
    name: offer.name,
    audience: offer.audience,
    ...applied,
  };
}
