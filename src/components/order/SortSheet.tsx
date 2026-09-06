"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SheetPortal } from "@/components/order/SheetPortal";
import { MENU_SORT_OPTIONS, type MenuSort } from "@/lib/order-display";
import { cn } from "@/lib/utils";

type SortSheetProps = {
  open: boolean;
  value: MenuSort;
  canClear: boolean;
  onClose: () => void;
  onSelect: (value: MenuSort) => void;
  onClear: () => void;
};

export function SortSheet({ open, value, canClear, onClose, onSelect, onClear }: SortSheetProps) {
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
              className="fixed inset-x-0 bottom-0 z-[90] mx-auto max-w-md rounded-t-[28px] bg-white px-5 pb-8 pt-4 shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">Sort dishes</h2>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-900"
                  onClick={onClose}
                  aria-label="Close sort"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="mt-3 space-y-1">
                {MENU_SORT_OPTIONS.map((option) => {
                  const active = option.id === value;
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(option.id)}
                        className={cn(
                          "flex min-h-12 w-full items-center justify-between rounded-2xl px-3 text-left text-sm font-semibold",
                          active ? "bg-amber-50 text-gray-900" : "text-gray-700"
                        )}
                      >
                        {option.label}
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border-2",
                            active ? "border-[#F5B400] bg-[#F5B400]" : "border-gray-300 bg-white"
                          )}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={onClear}
                disabled={!canClear}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl border border-gray-200 text-sm font-black text-gray-900 disabled:opacity-40"
              >
                Clear filter
              </button>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </SheetPortal>
  );
}
