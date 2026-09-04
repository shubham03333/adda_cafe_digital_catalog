"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { mapKitchenStatus, TRACK_STEPS, normalizeOrderStatus } from "@/lib/order-display";
import { getCustomerOrder } from "@/actions/order";
import { cn } from "@/lib/utils";
import { upsertPlacedOrder, type SessionOrder, type SessionOrderItem } from "@/lib/order-session";

function ItemList({ items, total }: { items: SessionOrderItem[]; total: number }) {
  if (!items.length) return null;
  return (
    <div className="mt-6 w-full max-w-sm rounded-[20px] bg-white p-4 text-left shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">You ordered</p>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 font-semibold text-gray-900">
              {item.quantity}× {item.name}
              {item.extras ? <span className="mt-0.5 block text-xs font-medium text-gray-500">{item.extras}</span> : null}
            </span>
            <span className="shrink-0 font-black text-gray-900">₹{item.price * item.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm font-black text-gray-900">
        <span>Total</span>
        <span>₹{total}</span>
      </p>
    </div>
  );
}

type SuccessProps = {
  orderNumber: string;
  tableNumber: number;
  status?: string;
  items?: SessionOrderItem[];
  total?: number;
  onContinue: () => void;
  onTrack: () => void;
};

export function OrderSuccess({ orderNumber, tableNumber, status, items = [], total = 0, onContinue, onTrack }: SuccessProps) {
  const waiting = (status || "").toLowerCase() === "pending";
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FAFAFA] px-6 py-8 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-10 w-10 text-emerald-700" strokeWidth={2.5} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Table {tableNumber}</p>
      <h1 className="mt-2 text-3xl font-black text-gray-900">{waiting ? "Sent to staff" : "Order confirmed"}</h1>
      <p className="mt-2 text-2xl font-black text-[#C99700]">#{orderNumber}</p>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
        {waiting
          ? "Staff will confirm this order at the counter. The kitchen starts after they accept."
          : "Your order has been sent to the kitchen. Estimated prep 8–12 min."}
      </p>
      <ItemList items={items} total={total} />
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <button type="button" onClick={onTrack} className="min-h-14 rounded-full bg-[#F5B400] text-base font-black text-gray-900">
          Track order
        </button>
        <button type="button" onClick={onContinue} className="min-h-12 rounded-full bg-white text-sm font-bold text-gray-900 shadow-sm">
          Continue ordering
        </button>
      </div>
    </div>
  );
}

type TrackerProps = {
  orderId: string | null;
  posOrderId?: string | null;
  orderNumber: string;
  status: string;
  tableNumber: number;
  items?: SessionOrderItem[];
  total?: number;
  placedAt?: string;
  onBackToMenu: () => void;
  onLiveUpdate?: (order: SessionOrder) => void;
};

export function OrderTracker({
  orderId,
  posOrderId,
  orderNumber,
  status,
  tableNumber,
  items = [],
  total = 0,
  placedAt,
  onBackToMenu,
  onLiveUpdate,
}: TrackerProps) {
  const [liveStatus, setLiveStatus] = useState(normalizeOrderStatus(status));
  const [liveItems, setLiveItems] = useState(items);
  const [liveTotal, setLiveTotal] = useState(total);
  const [staffEdited, setStaffEdited] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const baselineRef = useRef({ items, total });
  const liveRef = useRef({ onLiveUpdate, orderNumber, placedAt, tableNumber, posOrderId, orderId });
  liveRef.current = { onLiveUpdate, orderNumber, placedAt, tableNumber, posOrderId, orderId };

  useEffect(() => {
    setLiveItems(items);
    setLiveTotal(total);
    setStaffEdited(false);
    baselineRef.current = { items, total };
    setLiveStatus(normalizeOrderStatus(status));
  }, [orderNumber]);

  useEffect(() => {
    setLiveStatus((prev) => {
      const next = normalizeOrderStatus(status);
      if (next === "cancelled") return next;
      if (mapKitchenStatus(next) >= mapKitchenStatus(prev)) return next;
      return prev;
    });
  }, [status]);

  useEffect(() => {
    const tick = window.setInterval(() => setMinutes((m) => Math.max(0, m - 1)), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!orderId && !posOrderId && !orderNumber) return;

    async function refresh() {
      const order = await getCustomerOrder(orderId || "", posOrderId, orderNumber);
      if (!order) return;
      const nextStatus = normalizeOrderStatus(order.status);
      setLiveStatus((prev) => {
        if (nextStatus === "cancelled" || nextStatus === "ready" || nextStatus === "served") return nextStatus;
        if (mapKitchenStatus(nextStatus) >= mapKitchenStatus(prev)) return nextStatus;
        return prev;
      });
      const nextItems = (order.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      const nextTotal = Number(order.total) || 0;
      if (nextItems.length) setLiveItems(nextItems);
      setLiveTotal(nextTotal);
      const baseline = baselineRef.current;
      const changed =
        JSON.stringify(nextItems) !== JSON.stringify(baseline.items) || nextTotal !== Number(baseline.total);
      if (changed && nextItems.length) setStaffEdited(true);
      const snapshot: SessionOrder = {
        orderId: order.id || liveRef.current.orderId,
        posOrderId: order.posOrderId || liveRef.current.posOrderId,
        orderNumber: order.orderNumber || liveRef.current.orderNumber,
        status: nextStatus,
        total: nextTotal,
        items: nextItems.length ? nextItems : baseline.items,
        placedAt: liveRef.current.placedAt || new Date().toISOString(),
      };
      upsertPlacedOrder(liveRef.current.tableNumber, snapshot);
      liveRef.current.onLiveUpdate?.(snapshot);
    }

    void refresh();
    const poll = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(poll);
  }, [orderId, posOrderId, orderNumber]);

  const step = mapKitchenStatus(liveStatus);
  const cancelled = step < 0;

  return (
    <div className="min-h-dvh bg-[#FAFAFA] px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Table {tableNumber}</p>
      <h1 className="mt-2 text-2xl font-black text-gray-900">Order #{orderNumber}</h1>
      {cancelled ? (
        <div className="mt-8 rounded-[24px] bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">This order is cancelled</p>
          <p className="mt-2 text-sm text-gray-500">Staff cancelled it from the counter. You can place a new order from the menu.</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">
            {normalizeOrderStatus(liveStatus) === "pending"
              ? "Waiting for staff to confirm at the counter."
              : normalizeOrderStatus(liveStatus) === "ready"
                ? "Your order is ready."
                : step >= 3
                  ? "Enjoy your meal."
                  : minutes > 0
                    ? `About ${minutes} min remaining`
                    : "Almost ready"}
          </p>
          <ol className="mt-8 space-y-0">
            {TRACK_STEPS.map((label, index) => {
              const done = index <= step;
              return (
                <li key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-black", done ? "bg-[#F5B400] text-gray-900" : "bg-gray-200 text-gray-400")}>
                      {index + 1}
                    </span>
                    {index < TRACK_STEPS.length - 1 ? <span className={cn("h-8 w-0.5", index < step ? "bg-[#F5B400]" : "bg-gray-200")} /> : null}
                  </div>
                  <p className={cn("pt-1.5 text-sm font-bold", done ? "text-gray-900" : "text-gray-400")}>{label}</p>
                </li>
              );
            })}
          </ol>
          <div className="mx-auto max-w-sm">
            {staffEdited ? (
              <p className="mt-6 text-center text-xs font-semibold text-amber-700">Updated by staff</p>
            ) : null}
            <ItemList items={liveItems} total={liveTotal} />
          </div>
        </>
      )}
      <button type="button" onClick={onBackToMenu} className="mt-10 min-h-12 w-full rounded-full bg-white text-sm font-bold text-gray-900 shadow-sm">
        Back to menu
      </button>
    </div>
  );
}
