export type CatalogOffer = {
  id: number;
  code: string;
  name: string;
  scope: "bill" | "dish";
  discount_type: "percent" | "fixed";
  discount_value: number;
  menu_item_ids: number[] | null;
  min_bill: number;
  audience: "birthday" | "registered";
  used: boolean;
  is_active: boolean;
};

export type OfferLine = {
  id: number;
  price: number;
  quantity: number;
};

export function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function normalizeOfferCode(code: string) {
  return String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function isBirthdayToday(dateOfBirth?: string | null, now = new Date()) {
  const stamp = String(dateOfBirth || "").slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stamp);
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const todayMonth = Number(parts.find((part) => part.type === "month")?.value);
  const todayDay = Number(parts.find((part) => part.type === "day")?.value);
  return month === todayMonth && day === todayDay;
}

export function isFullyRegistered(guest: { phone?: string | null; email?: string | null; emailVerified?: boolean }) {
  return Boolean(guest.phone && guest.email && guest.emailVerified);
}

export function guestCanUseOffer(
  offer: Pick<CatalogOffer, "audience" | "used">,
  guest: { phone?: string | null; email?: string | null; emailVerified?: boolean; dateOfBirth?: string | null }
) {
  if (offer.used) return { ok: false as const, reason: "You already used this code." };
  if (offer.audience === "birthday") {
    if (!isBirthdayToday(guest.dateOfBirth)) {
      return { ok: false as const, reason: "This code is for your birthday." };
    }
    return { ok: true as const };
  }
  if (!isFullyRegistered(guest)) {
    return { ok: false as const, reason: "Sign in with email to unlock this offer." };
  }
  return { ok: true as const };
}

export function applyCatalogOffer(items: OfferLine[], offer: CatalogOffer) {
  const gross = roundMoney(items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0));
  if (gross < Number(offer.min_bill || 0)) {
    return {
      ok: false as const,
      gross,
      discount: 0,
      net: gross,
      error: `Add items worth ₹${Number(offer.min_bill).toFixed(0)} to use this code`,
    };
  }

  const value = Number(offer.discount_value);
  let eligible = gross;
  if (offer.scope === "dish") {
    const ids = new Set((offer.menu_item_ids || []).map(Number));
    eligible = roundMoney(
      items
        .filter((item) => ids.has(Number(item.id)))
        .reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
    );
    if (eligible <= 0) {
      return { ok: false as const, gross, discount: 0, net: gross, error: "Add the offer dish to apply this code" };
    }
  }

  let discount =
    offer.discount_type === "fixed" ? roundMoney(Math.min(value, eligible)) : roundMoney((eligible * value) / 100);
  if (discount > gross) discount = gross;
  return { ok: true as const, gross, discount, net: roundMoney(gross - discount) };
}

export function offerHeadline(offer: CatalogOffer) {
  if (offer.discount_type === "percent") {
    return offer.scope === "dish" ? `${offer.discount_value}% off selected dishes` : `${offer.discount_value}% off your bill`;
  }
  return offer.scope === "dish" ? `₹${offer.discount_value} off selected dishes` : `₹${offer.discount_value} off your bill`;
}
