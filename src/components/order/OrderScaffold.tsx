"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CafeHeader } from "@/components/layout/CafeHeader";
import { CafeShell } from "@/components/layout/CafeShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Dish } from "@/data/menuData";
import { placeOrder } from "@/actions/order";

type OrderScaffoldProps = {
  tableNumber: number;
  dishes: Dish[];
  orderingEnabled: boolean;
};

function sessionId() {
  const key = "adda-review-session";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export function OrderScaffold({ tableNumber, dishes, orderingEnabled }: OrderScaffoldProps) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ orderNumber: string; status: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const lines = useMemo(() => {
    return dishes
      .map((dish) => {
        const count = qty[String(dish.id)] ?? 0;
        if (count < 1) return null;
        const posId = dish.posMenuItemId;
        if (!posId) return null;
        return {
          id: posId,
          name: dish.name,
          price: dish.price,
          quantity: count,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [dishes, qty]);

  const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CafeShell>
      <CafeHeader href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"} />
      <main className="px-4 py-4 space-y-4 pb-28">
        <p className="text-xs text-center text-gray-500">Table {tableNumber} · scaffold UI</p>
        {!orderingEnabled ? (
          <Card>
            <p className="text-sm">Ordering is off. Browse the menu or leave a review.</p>
            <Link className="mt-3 inline-block text-sm font-semibold text-red-700" href={`/menu?table=${tableNumber}`}>
              Open menu
            </Link>
          </Card>
        ) : null}
        {result ? (
          <Card>
            <p className="font-black text-lg">Order #{result.orderNumber}</p>
            <p className="text-sm text-gray-600">Status: {result.status}</p>
          </Card>
        ) : null}
        {message ? <p className="text-sm text-red-600">{message}</p> : null}
        {dishes.map((dish) => {
          const key = String(dish.id);
          const count = qty[key] ?? 0;
          const canOrder = Boolean(dish.posMenuItemId);
          return (
            <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-white dark:bg-zinc-900 p-3 shadow">
              <div className="min-w-0">
                <p className="font-semibold truncate">{dish.name}</p>
                <p className="text-sm text-amber-700">₹{dish.price}</p>
                {!canOrder ? <p className="text-xs text-gray-400">Not linked to POS yet</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={!canOrder || count < 1} onClick={() => setQty({ ...qty, [key]: Math.max(0, count - 1) })}>
                  -
                </Button>
                <span className="w-6 text-center text-sm">{count}</span>
                <Button type="button" variant="outline" size="sm" disabled={!canOrder} onClick={() => setQty({ ...qty, [key]: count + 1 })}>
                  +
                </Button>
              </div>
            </div>
          );
        })}
      </main>
      {orderingEnabled ? (
        <div className="fixed bottom-0 inset-x-0 z-50">
          <div className="max-w-md mx-auto px-4 pb-4">
            <Button
              className="w-full"
              size="lg"
              disabled={pending || lines.length === 0}
              onClick={() => {
                startTransition(async () => {
                  setMessage(null);
                  const placed = await placeOrder({
                    tableNumber,
                    items: lines,
                    total,
                    sessionId: sessionId(),
                    idempotencyKey: crypto.randomUUID(),
                  });
                  if (!placed.ok) {
                    setMessage(placed.error);
                    return;
                  }
                  setResult({ orderNumber: placed.orderNumber ?? "", status: placed.status });
                  setQty({});
                });
              }}
            >
              {pending ? "Sending..." : `Submit order · ₹${total}`}
            </Button>
          </div>
        </div>
      ) : null}
    </CafeShell>
  );
}
