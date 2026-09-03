"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { mapKitchenStatus, TRACK_STEPS } from "@/lib/order-display";
import { getCustomerOrder } from "@/actions/order";
import { cn } from "@/lib/utils";

type SuccessProps = {
  orderNumber: string;
  tableNumber: number;
  onContinue: () => void;
  onTrack: () => void;
};

export function OrderSuccess({ orderNumber, tableNumber, onContinue, onTrack }: SuccessProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FAFAFA] px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <Check className="h-10 w-10 text-emerald-700" strokeWidth={2.5} />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Table {tableNumber}</p>
      <h1 className="mt-2 text-3xl font-black text-gray-900">Order confirmed</h1>
      <p className="mt-2 text-2xl font-black text-[#C99700]">#{orderNumber}</p>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
        Your order has been sent to the kitchen. Estimated prep 8–12 min.
      </p>
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
  orderNumber: string;
  status: string;
  tableNumber: number;
  onBackToMenu: () => void;
};

export function OrderTracker({ orderId, orderNumber, status, tableNumber, onBackToMenu }: TrackerProps) {
  const [liveStatus, setLiveStatus] = useState(status);
  const [minutes, setMinutes] = useState(10);

  useEffect(() => {
    const tick = window.setInterval(() => setMinutes((m) => Math.max(0, m - 1)), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!orderId) return;
    const poll = window.setInterval(() => {
      void getCustomerOrder(orderId).then((order) => {
        if (order?.status) setLiveStatus(order.status);
      });
    }, 8000);
    return () => window.clearInterval(poll);
  }, [orderId]);

  const step = mapKitchenStatus(liveStatus);
  const cancelled = step < 0;

  return (
    <div className="min-h-dvh bg-[#FAFAFA] px-5 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Table {tableNumber}</p>
      <h1 className="mt-2 text-2xl font-black text-gray-900">Order #{orderNumber}</h1>
      {cancelled ? (
        <div className="mt-8 rounded-[24px] bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-black text-gray-900">This order was cancelled</p>
          <p className="mt-2 text-sm text-gray-500">The kitchen removed it. You can place a new order from the menu.</p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">
            {step >= 3 ? "Enjoy your meal." : minutes > 0 ? `About ${minutes} min remaining` : "Almost ready"}
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
        </>
      )}
      <button type="button" onClick={onBackToMenu} className="mt-10 min-h-12 w-full rounded-full bg-white text-sm font-bold text-gray-900 shadow-sm">
        Back to menu
      </button>
    </div>
  );
}
