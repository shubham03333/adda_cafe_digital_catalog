"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Percent, Pencil, Trash2, X } from "lucide-react";
import type { Dish } from "@/data/menuData";
import { extrasLabel, lineItemTotal, type ItemExtras } from "@/lib/order-display";
import { QtyStepper } from "@/components/order/QtyStepper";
import { EmptyState } from "@/components/order/MenuItemCard";
import { SheetPortal } from "@/components/order/SheetPortal";
import { MenuPhoto } from "@/components/order/MenuPhoto";

type BagRow = { dish: Dish; quantity: number; extras?: ItemExtras };

type CartSheetProps = {
  open: boolean;
  items: BagRow[];
  dishes: Dish[];
  total: number;
  payable: number;
  discount: number;
  appliedCode: string | null;
  appliedName?: string | null;
  pending: boolean;
  error: string | null;
  canPlace: boolean;
  onClose: () => void;
  onQuantity: (dish: Dish, next: number) => void;
  onEdit: (dish: Dish) => void;
  onRemove: (dish: Dish) => void;
  onOpenCoupons: () => void;
  onClearCoupon: () => void;
  onPlace: () => void;
};

export function CartSheet({
  open,
  items,
  dishes,
  total,
  payable,
  discount,
  appliedCode,
  appliedName,
  pending,
  error,
  canPlace,
  onClose,
  onQuantity,
  onEdit,
  onRemove,
  onOpenCoupons,
  onClearCoupon,
  onPlace,
}: CartSheetProps) {
  return (
    <SheetPortal>
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-[60] mx-auto max-w-md bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex h-[88dvh] max-w-md flex-col rounded-t-[28px] bg-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-xl font-black text-gray-900">Your cart</h2>
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-900" onClick={onClose} aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {items.length === 0 ? (
                <EmptyState title="Your cart is empty" body="Add a dish from the menu. We’ll send it straight to the kitchen." />
              ) : (
                <ul className="space-y-3">
                  {items.map(({ dish, quantity, extras }) => (
                    <li key={String(dish.id)} className="rounded-[20px] bg-[#FAFAFA] p-3 shadow-sm">
                      <div className="flex gap-3">
                        <MenuPhoto src={dish.image} className="h-16 w-16 rounded-2xl" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900">{dish.name}</p>
                          {extrasLabel(extras) ? (
                            <details className="mt-1">
                              <summary className="cursor-pointer text-xs font-medium text-gray-500">Customisation</summary>
                              <p className="mt-1 text-xs text-gray-600">{extrasLabel(extras)}</p>
                            </details>
                          ) : null}
                          <p className="mt-1 text-sm font-black text-gray-900">
                            ₹{lineItemTotal(dish, quantity, extras, dishes)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <QtyStepper size="sm" value={quantity} min={0} onChange={(next) => onQuantity(dish, next)} label={dish.name} />
                        <div className="flex gap-1">
                          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-700" onClick={() => onEdit(dish)} aria-label={`Edit ${dish.name}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-red-600" onClick={() => onRemove(dish)} aria-label={`Remove ${dish.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

              {items.length > 0 ? (
                <div className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-3 text-left">
                  <button type="button" onClick={onOpenCoupons} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
                      <Percent className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      {appliedCode ? (
                        <>
                          <span className="block text-sm font-black text-emerald-800">{appliedCode} applied</span>
                          <span className="block truncate text-xs text-emerald-700">
                            {appliedName ? `${appliedName} · ` : ""}You save ₹{discount}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block text-sm font-black text-gray-900">Apply coupon</span>
                          <span className="block text-xs text-gray-500">View birthday and member offers</span>
                        </>
                      )}
                    </span>
                  </button>
                  {appliedCode ? (
                    <button type="button" className="pl-3 text-xs font-black text-red-600" onClick={onClearCoupon}>
                      REMOVE
                    </button>
                  ) : (
                    <button type="button" className="pl-3 text-xs font-black text-emerald-700" onClick={onOpenCoupons}>
                      VIEW
                    </button>
                  )}
                </div>
              ) : null}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Item total</span>
                  <span className="font-semibold text-gray-900">₹{total}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon discount</span>
                    <span className="font-semibold">-₹{discount}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-gray-400">
                  <span>Tax & service</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-black text-gray-900">
                  <span>To pay</span>
                  <span>₹{payable}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={pending || !canPlace}
                onClick={onPlace}
                className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#F5B400] text-base font-black text-gray-900 shadow-lg disabled:opacity-50 active:scale-[0.99]"
              >
                {pending ? "Sending to kitchen…" : `Place order · ₹${payable}`}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
    </SheetPortal>
  );
}
