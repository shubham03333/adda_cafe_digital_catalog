"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { GuestHistoryOrder } from "@/actions/order";
import { SheetPortal } from "@/components/order/SheetPortal";

type GuestOrdersSheetProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  orders: GuestHistoryOrder[];
  guestName?: string;
  onClose: () => void;
  onSelect: (order: GuestHistoryOrder) => void;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function GuestOrdersSheet({
  open,
  loading,
  error,
  orders,
  guestName,
  onClose,
  onSelect,
}: GuestOrdersSheetProps) {
  return (
    <SheetPortal>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-label="My orders"
              className="flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-[28px] bg-white shadow-2xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <div>
                  <p className="text-lg font-black text-gray-900">My orders</p>
                  <p className="text-xs text-gray-500">
                    {guestName ? `${guestName} · ` : ""}
                    Past orders on this mobile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
                {loading ? (
                  <p className="py-10 text-center text-sm text-gray-500">Loading orders…</p>
                ) : error ? (
                  <p className="py-10 text-center text-sm text-red-600">{error}</p>
                ) : orders.length === 0 ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    No past orders yet for this number. Place an order and it will show up here.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {orders.map((order) => (
                      <li key={order.orderId}>
                        <button
                          type="button"
                          className="w-full rounded-2xl bg-[#FAFAFA] px-3 py-3 text-left"
                          onClick={() => onSelect(order)}
                        >
                          <span className="flex items-center justify-between gap-2 text-sm font-black text-gray-900">
                            <span>#{order.orderNumber}</span>
                            <span>₹{order.total}</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {formatWhen(order.placedAt)}
                            {order.tableNumber ? ` · Table ${order.tableNumber}` : ""}
                            {` · ${order.status}`}
                          </span>
                          <span className="mt-1 block truncate text-xs text-gray-600">
                            {order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SheetPortal>
  );
}
