"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, X } from "lucide-react";
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
  pending: boolean;
  error: string | null;
  canPlace: boolean;
  onClose: () => void;
  onQuantity: (dish: Dish, next: number) => void;
  onEdit: (dish: Dish) => void;
  onRemove: (dish: Dish) => void;
  onPlace: () => void;
};

export function CartSheet({
  open,
  items,
  dishes,
  total,
  pending,
  error,
  canPlace,
  onClose,
  onQuantity,
  onEdit,
  onRemove,
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
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{total}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax & service</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-black text-gray-900">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={pending || !canPlace}
                onClick={onPlace}
                className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#F5B400] text-base font-black text-gray-900 shadow-lg disabled:opacity-50 active:scale-[0.99]"
              >
                {pending ? "Sending to kitchen…" : `Place order · ₹${total}`}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
    </SheetPortal>
  );
}
