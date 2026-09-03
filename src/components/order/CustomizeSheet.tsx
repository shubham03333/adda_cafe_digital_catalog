"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Dish } from "@/data/menuData";
import {
  extrasLabel,
  isRoll,
  isVegDish,
  lineItemTotal,
  prepMinutes,
  type ItemExtras,
} from "@/lib/order-display";
import { QtyStepper } from "@/components/order/QtyStepper";
import { VegMark } from "@/components/order/VegMark";
import { cn } from "@/lib/utils";
import { SheetPortal } from "@/components/order/SheetPortal";
import { MenuPhoto } from "@/components/order/MenuPhoto";

type CustomizeSheetProps = {
  dish: Dish | null;
  dishes: Dish[];
  quantity: number;
  extras: ItemExtras;
  canOrder: boolean;
  onClose: () => void;
  onQuantity: (next: number) => void;
  onExtras: (next: ItemExtras) => void;
  onConfirm: () => void;
};

export function CustomizeSheet({
  dish,
  dishes,
  quantity,
  extras,
  canOrder,
  onClose,
  onQuantity,
  onExtras,
  onConfirm,
}: CustomizeSheetProps) {
  if (!dish) return null;
  const roll = isRoll(dish);
  const cheesePrice = dishes.find((item) => /x-?tra\s*cheese|extra\s*cheese/i.test(item.name))?.price ?? 10;
  const lineTotal = lineItemTotal(dish, quantity, extras, dishes);

  return (
    <SheetPortal>
      <AnimatePresence>
        <motion.div
          key="customize-backdrop"
          className="fixed inset-0 z-[60] mx-auto max-w-md bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          key="customize-sheet"
          className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex h-[85dvh] max-w-md flex-col rounded-t-[28px] bg-white shadow-2xl"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          <div className="relative h-44 shrink-0 overflow-hidden rounded-t-[28px]">
            <MenuPhoto src={dish.image} className="h-full w-full" priority />
            <button
              type="button"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex items-start gap-2">
              <VegMark veg={isVegDish(dish)} className="mt-1" />
              <div>
                <h2 className="text-xl font-black text-gray-900">{dish.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{dish.description}</p>
              </div>
            </div>
            <p className="mt-3 text-2xl font-black text-gray-900">₹{dish.price}</p>
            <p className="text-xs text-gray-400">{prepMinutes(dish)} min prep</p>
            <div className="my-4 h-px bg-gray-100" />

            <section className="rounded-[20px] border-2 border-[#F5B400]/50 bg-amber-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Required</p>
              <p className="mt-1 font-bold text-gray-900">Quantity</p>
              <div className="mt-3">
                <QtyStepper value={Math.max(1, quantity)} min={1} onChange={onQuantity} label={dish.name} />
              </div>
            </section>

            {roll ? (
              <section className="mt-3 rounded-[20px] bg-[#FAFAFA] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Optional</p>
                <button
                  type="button"
                  onClick={() => onExtras({ ...extras, extraCheese: !extras.extraCheese })}
                  className={cn(
                    "mt-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left",
                    extras.extraCheese ? "bg-[#F5B400] text-gray-900" : "bg-white text-gray-800 shadow-sm"
                  )}
                >
                  <span className="font-semibold">Extra cheese</span>
                  <span className="font-black">+₹{cheesePrice}</span>
                </button>
              </section>
            ) : null}

            <label className="mt-3 block rounded-[20px] bg-[#FAFAFA] p-4">
              <span className="text-sm font-bold text-gray-900">Special instructions</span>
              <textarea
                value={extras.note}
                onChange={(e) => onExtras({ ...extras, note: e.target.value.slice(0, 120) })}
                rows={2}
                placeholder="Less spicy, no onion…"
                className="mt-2 w-full resize-none bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </label>
            {extrasLabel(extras) ? <p className="mt-2 text-xs text-gray-500">{extrasLabel(extras)}</p> : null}
          </div>
          <div className="border-t border-gray-100 p-4">
            {canOrder ? (
              <button
                type="button"
                onClick={onConfirm}
                className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#F5B400] px-6 text-base font-black text-gray-900 shadow-lg active:scale-[0.99]"
              >
                <span>Add to cart · {Math.max(1, quantity)}</span>
                <span>₹{lineTotal}</span>
              </button>
            ) : (
              <p className="text-center text-sm text-gray-500">This dish isn’t linked to the kitchen yet. Please ask staff.</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </SheetPortal>
  );
}
