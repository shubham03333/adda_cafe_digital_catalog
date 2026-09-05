"use client";

import { useState } from "react";
import { Gift, Percent, Ticket, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SheetPortal } from "@/components/order/SheetPortal";
import { normalizeOfferCode } from "@/lib/guest-offers";
import type { GuestOfferCard } from "@/actions/offers";

type CouponSheetProps = {
  open: boolean;
  birthday: boolean;
  registered: boolean;
  offers: GuestOfferCard[];
  appliedCode: string | null;
  error: string | null;
  onClose: () => void;
  onApply: (code: string) => void;
  onRemove: () => void;
};

export function CouponSheet({
  open,
  birthday,
  registered,
  offers,
  appliedCode,
  error,
  onClose,
  onApply,
  onRemove,
}: CouponSheetProps) {
  const [typed, setTyped] = useState("");
  const available = offers.filter((offer) => !offer.locked);
  const locked = offers.filter((offer) => offer.locked);

  return (
    <SheetPortal>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-[80] mx-auto max-w-md bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex h-[86dvh] max-w-md flex-col rounded-t-[28px] bg-[#F4F4F5]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Apply coupon</h2>
                  <p className="text-xs font-medium text-gray-500">Discount is confirmed when you pay at the counter.</p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900"
                  onClick={onClose}
                  aria-label="Close coupons"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8">
                <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
                  <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="h-12 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-base font-bold tracking-wide text-gray-900 outline-none"
                  />
                  <button
                    type="button"
                    disabled={!typed.trim()}
                    onClick={() => onApply(normalizeOfferCode(typed))}
                    className="rounded-xl px-4 text-sm font-black text-emerald-700 disabled:text-gray-300"
                  >
                    APPLY
                  </button>
                </div>
                {error ? <p className="mt-2 px-1 text-sm font-semibold text-red-600">{error}</p> : null}

                {birthday ? (
                  <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-100 to-rose-100 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-black text-rose-800">
                      <Gift className="h-4 w-4" /> Happy birthday
                    </p>
                    <p className="mt-1 text-xs text-rose-700">Your birthday coupon is ready. Apply it before you place the order.</p>
                  </div>
                ) : null}

                {!registered ? (
                  <p className="mt-4 text-xs font-medium text-gray-500">
                    More cafe offers unlock after you create an account with email + mobile.
                  </p>
                ) : null}

                {available.length > 0 ? (
                  <section className="mt-4 space-y-3">
                    <h3 className="px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Available coupons</h3>
                    {available.map((offer) => (
                      <CouponCard
                        key={offer.code}
                        offer={offer}
                        applied={appliedCode === offer.code}
                        onApply={() => onApply(offer.code)}
                        onRemove={onRemove}
                      />
                    ))}
                  </section>
                ) : (
                  <p className="mt-8 text-center text-sm text-gray-500">No coupons for you right now.</p>
                )}

                {locked.length > 0 ? (
                  <section className="mt-6 space-y-3">
                    <h3 className="px-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Locked</h3>
                    {locked.map((offer) => (
                      <CouponCard key={offer.code} offer={offer} applied={false} locked />
                    ))}
                  </section>
                ) : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </SheetPortal>
  );
}

function CouponCard({
  offer,
  applied,
  locked,
  onApply,
  onRemove,
}: {
  offer: GuestOfferCard;
  applied: boolean;
  locked?: boolean;
  onApply?: () => void;
  onRemove?: () => void;
}) {
  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-sm ${locked ? "opacity-60" : ""}`}>
      <div className="flex">
        <div className="flex w-16 flex-col items-center justify-center bg-emerald-700 px-1 text-center text-[10px] font-black uppercase tracking-wide text-white">
          <Percent className="mb-1 h-4 w-4" />
          {offer.audience === "birthday" ? "Bday" : "Save"}
        </div>
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1 font-black text-gray-900">
                <Ticket className="h-4 w-4 text-emerald-700" />
                {offer.code}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800">{offer.name}</p>
              <p className="mt-1 text-xs text-gray-500">{offer.headline}</p>
              {offer.min_bill > 0 ? <p className="mt-1 text-[11px] text-gray-400">Min order ₹{offer.min_bill}</p> : null}
              {locked && offer.lockReason ? <p className="mt-1 text-xs font-semibold text-amber-700">{offer.lockReason}</p> : null}
              {!locked && offer.savings > 0 ? (
                <p className="mt-1 text-xs font-bold text-emerald-700">You save ₹{offer.savings}</p>
              ) : null}
            </div>
            {!locked ? (
              applied ? (
                <button type="button" className="text-xs font-black text-red-600" onClick={onRemove}>
                  REMOVE
                </button>
              ) : (
                <button type="button" className="text-xs font-black text-emerald-700" onClick={onApply}>
                  APPLY
                </button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
