"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CafeShell } from "@/components/layout/CafeShell";
import type { Dish } from "@/data/menuData";
import { placeOrder } from "@/actions/order";
import {
  buildCategoryRail,
  extrasLabel,
  matchesFilter,
  QUICK_FILTERS,
  type ItemExtras,
  type QuickFilter,
} from "@/lib/order-display";
import { OrderHeader, FilterChips } from "@/components/order/OrderHeader";
import { CategoryRail } from "@/components/order/CategoryRail";
import { EmptyState, MenuItemCard } from "@/components/order/MenuItemCard";
import { CustomizeSheet } from "@/components/order/CustomizeSheet";
import { CartSheet } from "@/components/order/CartSheet";
import { OrderSuccess, OrderTracker } from "@/components/order/OrderStatusScreens";
import { cn } from "@/lib/utils";

type OrderMenuProps = {
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

const EMPTY_EXTRAS: ItemExtras = { note: "" };

export function OrderMenu({ tableNumber, dishes, orderingEnabled }: OrderMenuProps) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [extrasById, setExtrasById] = useState<Record<string, ItemExtras>>({});
  const [category, setCategory] = useState("All");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [detail, setDetail] = useState<Dish | null>(null);
  const [draftQty, setDraftQty] = useState(1);
  const [draftExtras, setDraftExtras] = useState<ItemExtras>(EMPTY_EXTRAS);
  const [screen, setScreen] = useState<"menu" | "success" | "track">("menu");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    orderId: string | null;
    orderNumber: string;
    status: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const rail = useMemo(() => buildCategoryRail(dishes), [dishes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (dish.category === "Topping") return false;
      if (category !== "All" && dish.category !== category) return false;
      if (!matchesFilter(dish, filter)) return false;
      if (!q) return true;
      return dish.name.toLowerCase().includes(q) || dish.description.toLowerCase().includes(q);
    });
  }, [dishes, category, filter, query]);

  function countOf(dish: Dish) {
    return qty[String(dish.id)] ?? 0;
  }

  function setCount(dish: Dish, next: number) {
    const key = String(dish.id);
    setQty((prev) => ({ ...prev, [key]: Math.max(0, next) }));
    if (next <= 0) {
      setExtrasById((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  }

  function openCustomize(dish: Dish) {
    const current = countOf(dish);
    setDetail(dish);
    setDraftQty(Math.max(1, current));
    setDraftExtras(extrasById[String(dish.id)] ?? EMPTY_EXTRAS);
  }

  function confirmCustomize() {
    if (!detail) return;
    setCount(detail, draftQty);
    setExtrasById((prev) => ({ ...prev, [String(detail.id)]: draftExtras }));
    setDetail(null);
  }

  const bagItems = useMemo(() => {
    const rows: { dish: Dish; quantity: number; extras?: ItemExtras }[] = [];
    for (const dish of dishes) {
      const quantity = qty[String(dish.id)] ?? 0;
      if (quantity < 1) continue;
      rows.push({ dish, quantity, extras: extrasById[String(dish.id)] });
    }
    return rows;
  }, [dishes, qty, extrasById]);

  const itemCount = bagItems.reduce((sum, row) => sum + row.quantity, 0);
  const total = bagItems.reduce((sum, row) => sum + row.dish.price * row.quantity, 0);

  const posLines = bagItems
    .filter((row) => row.dish.posMenuItemId)
    .map((row) => ({
      id: row.dish.posMenuItemId as number,
      name: row.dish.name,
      price: row.dish.price,
      quantity: row.quantity,
    }));

  const kitchenNotes = bagItems
    .map((row) => {
      const label = extrasLabel(row.extras);
      return label ? `${row.dish.name}: ${label}` : "";
    })
    .filter(Boolean)
    .join(" | ");

  const menuHref = tableNumber ? `/menu?table=${tableNumber}` : "/menu";

  function submit() {
    startTransition(async () => {
      setMessage(null);
      const placed = await placeOrder({
        tableNumber,
        items: posLines,
        total: posLines.reduce((sum, item) => sum + item.price * item.quantity, 0),
        sessionId: sessionId(),
        idempotencyKey: crypto.randomUUID(),
        notes: kitchenNotes || undefined,
      });
      if (!placed.ok) {
        setMessage(placed.error);
        setBagOpen(true);
        return;
      }
      setResult({
        orderId: placed.orderId ?? null,
        orderNumber: placed.orderNumber ?? "",
        status: placed.status,
      });
      setQty({});
      setExtrasById({});
      setBagOpen(false);
      setScreen("success");
    });
  }

  if (result && screen === "success") {
    return (
      <CafeShell forceLight tone="order">
        <OrderSuccess
          orderNumber={result.orderNumber}
          tableNumber={tableNumber}
          onContinue={() => {
            setResult(null);
            setScreen("menu");
          }}
          onTrack={() => setScreen("track")}
        />
      </CafeShell>
    );
  }

  if (result && screen === "track") {
    return (
      <CafeShell forceLight tone="order">
        <OrderTracker
          orderId={result.orderId}
          orderNumber={result.orderNumber}
          status={result.status}
          tableNumber={tableNumber}
          onBackToMenu={() => {
            setResult(null);
            setScreen("menu");
          }}
        />
      </CafeShell>
    );
  }

  return (
    <CafeShell forceLight tone="order">
      <OrderHeader
        tableNumber={tableNumber}
        itemCount={itemCount}
        searchOpen={searchOpen}
        query={query}
        onSearchOpen={setSearchOpen}
        onQuery={setQuery}
        onOpenCart={() => setBagOpen(true)}
      />
      <FilterChips
        options={QUICK_FILTERS}
        value={filter}
        onChange={(id) => setFilter(id as QuickFilter)}
      />

      {!orderingEnabled ? (
        <div className="mx-3 mb-2 shrink-0 rounded-[20px] bg-amber-50 p-4 text-sm text-gray-800">
          Ordering is off right now. You can still browse.
          <Link href={menuHref} className="mt-2 block font-bold text-gray-900">
            Open menu
          </Link>
        </div>
      ) : null}

      <div className={cn("flex min-h-0 flex-1 items-stretch gap-2 overflow-hidden px-2", itemCount > 0 ? "pb-24" : "pb-3")}>
        <CategoryRail items={rail} selected={category} onSelect={setCategory} />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pt-1 hide-scrollbar">
          <div className="space-y-3 pb-4">
          {visible.map((dish) => (
            <MenuItemCard
              key={String(dish.id)}
              dish={dish}
              quantity={countOf(dish)}
              canOrder={orderingEnabled && Boolean(dish.posMenuItemId)}
              onAdd={() => openCustomize(dish)}
              onOpen={() => openCustomize(dish)}
            />
          ))}
          {visible.length === 0 ? (
            query.trim() ? (
              <EmptyState title="No matches" body="Try another search, or tap a category on the left." />
            ) : (
              <EmptyState title="Nothing here yet" body="This category is empty. Pick another from the rail." />
            )
          ) : null}
          </div>
        </div>
      </div>

      {itemCount > 0 && orderingEnabled ? (
        <div className="fixed bottom-0 inset-x-0 z-50">
          <div className="mx-auto max-w-md px-3 pb-4">
            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="flex min-h-14 w-full items-center justify-between rounded-full bg-[#F5B400] px-5 text-gray-900 shadow-xl active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 font-black">
                <ShoppingBag className="h-5 w-5" />
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <span className="font-black">₹{total} · View cart</span>
            </button>
          </div>
        </div>
      ) : null}

      {detail ? (
        <CustomizeSheet
          dish={detail}
          quantity={draftQty}
          extras={draftExtras}
          canOrder={orderingEnabled && Boolean(detail.posMenuItemId)}
          onClose={() => setDetail(null)}
          onQuantity={setDraftQty}
          onExtras={setDraftExtras}
          onConfirm={confirmCustomize}
        />
      ) : null}

      <CartSheet
        open={bagOpen}
        items={bagItems}
        total={total}
        pending={pending}
        error={message}
        canPlace={posLines.length > 0}
        onClose={() => setBagOpen(false)}
        onQuantity={setCount}
        onEdit={(dish) => {
          setBagOpen(false);
          openCustomize(dish);
        }}
        onRemove={(dish) => setCount(dish, 0)}
        onPlace={submit}
      />
    </CafeShell>
  );
}
