"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CafeShell } from "@/components/layout/CafeShell";
import type { Dish } from "@/data/menuData";
import { getCustomerOrder, getGuestOrderHistory, placeOrder, type GuestHistoryOrder } from "@/actions/order";
import { buildCategoryRail, extraCheeseQty, extrasLabel, findExtraCheeseDish, isCancelledStatus, lineItemTotal, normalizeOrderStatus, type ItemExtras } from "@/lib/order-display";
import { OrderHeader, FilterChips } from "@/components/order/OrderHeader";
import { CategoryRail } from "@/components/order/CategoryRail";
import { EmptyState, MenuItemCard } from "@/components/order/MenuItemCard";
import { CustomizeSheet } from "@/components/order/CustomizeSheet";
import { CartSheet } from "@/components/order/CartSheet";
import { GuestOrdersSheet } from "@/components/order/GuestOrdersSheet";
import { OrderSuccess, OrderTracker } from "@/components/order/OrderStatusScreens";
import { appendPlacedOrder, readPlacedOrders, upsertPlacedOrder, writePlacedOrders, type SessionOrder } from "@/lib/order-session";
import { GUEST_STORAGE_KEY, type GuestProfile } from "@/lib/guest-profile";
import { GuestGate } from "@/components/order/GuestGate";
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
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [detail, setDetail] = useState<Dish | null>(null);
  const [draftQty, setDraftQty] = useState(1);
  const [draftExtras, setDraftExtras] = useState<ItemExtras>(EMPTY_EXTRAS);
  const [screen, setScreen] = useState<"menu" | "success" | "track">("menu");
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SessionOrder | null>(null);
  const [placed, setPlaced] = useState<SessionOrder[]>([]);
  const [guest, setGuest] = useState<GuestProfile | null>(null);
  const [guestReady, setGuestReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<GuestHistoryOrder[]>([]);
  const [pending, startTransition] = useTransition();
  const placedRef = useRef(placed);
  placedRef.current = placed;

  useEffect(() => {
    setPlaced(readPlacedOrders(tableNumber));
    try {
      const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) setGuest(JSON.parse(raw) as GuestProfile);
    } catch {
      sessionStorage.removeItem(GUEST_STORAGE_KEY);
    }
    setGuestReady(true);
  }, [tableNumber]);

  useEffect(() => {
    let cancelled = false;
    async function refreshVisit() {
      const current = placedRef.current;
      if (!current.length) return;
      const next = [...current];
      let changed = false;
      for (let i = 0; i < next.length; i += 1) {
        const order = next[i];
        if (!order.orderId && !order.posOrderId && !order.orderNumber) continue;
        const live = await getCustomerOrder(order.orderId || "", order.posOrderId, order.orderNumber);
        if (!live || cancelled) continue;
        const status = normalizeOrderStatus(live.status);
        if (status !== normalizeOrderStatus(order.status) || Number(live.total) !== Number(order.total)) {
          next[i] = {
            ...order,
            orderId: live.id || order.orderId,
            posOrderId: live.posOrderId || order.posOrderId,
            status,
            total: Number(live.total) || order.total,
            items: live.items?.length ? live.items : order.items,
            orderNumber: live.orderNumber || order.orderNumber,
          };
          changed = true;
        }
      }
      if (changed && !cancelled) {
        setPlaced(writePlacedOrders(tableNumber, next));
      }
    }

    void refreshVisit();
    const poll = window.setInterval(() => {
      void refreshVisit();
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [tableNumber]);

  async function loadHistory(phone: string) {
    setHistoryLoading(true);
    setHistoryError(null);
    const result = await getGuestOrderHistory(phone);
    setHistory(result.orders);
    if (!result.ok) setHistoryError(result.error);
    setHistoryLoading(false);
  }

  function openHistory() {
    if (!guest) return;
    setHistoryOpen(true);
    void loadHistory(guest.phone);
  }

  const rail = useMemo(() => buildCategoryRail(dishes), [dishes]);
  const categoryChips = useMemo(
    () => rail.map((item) => ({ id: item.name, label: item.name })),
    [rail]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (category !== "All" && dish.category !== category) return false;
      if (!q) return true;
      return dish.name.toLowerCase().includes(q) || dish.description.toLowerCase().includes(q);
    });
  }, [dishes, category, query]);

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
  const total = bagItems.reduce((sum, row) => sum + lineItemTotal(row.dish, row.quantity, row.extras, dishes), 0);

  const extraCheeseDish = findExtraCheeseDish(dishes);
  const posLines = bagItems.flatMap((row) => {
    if (!row.dish.posMenuItemId) return [];
    const lines = [
      {
        id: row.dish.posMenuItemId as number,
        name: row.dish.name,
        price: row.dish.price,
        quantity: row.quantity,
      },
    ];
    if (extraCheeseQty(row.extras) > 0 && extraCheeseDish?.posMenuItemId) {
      lines.push({
        id: extraCheeseDish.posMenuItemId,
        name: extraCheeseDish.name,
        price: Number(extraCheeseDish.price),
        quantity: extraCheeseQty(row.extras),
      });
    }
    return lines;
  });

  const kitchenNotes = bagItems
    .map((row) => {
      const label = extrasLabel(row.extras);
      return label ? `${row.dish.name}: ${label}` : "";
    })
    .filter(Boolean)
    .join(" | ");

  const visitOrders = placed.filter((order) => !isCancelledStatus(order.status));
  const menuHref = tableNumber ? `/menu?table=${tableNumber}` : "/menu";

  function submit() {
    startTransition(async () => {
      setMessage(null);
      if (!guest) {
        setMessage("Enter your name and mobile to place an order.");
        setBagOpen(true);
        return;
      }
      const placed = await placeOrder({
        tableNumber,
        items: posLines,
        total: posLines.reduce((sum, item) => sum + item.price * item.quantity, 0),
        sessionId: sessionId(),
        idempotencyKey: crypto.randomUUID(),
        notes: kitchenNotes || undefined,
        customerName: guest.name,
        customerPhone: guest.phone,
      });
      if (!placed.ok) {
        setMessage(placed.error);
        setBagOpen(true);
        return;
      }
      const snapshot: SessionOrder = {
        orderId: placed.orderId ?? null,
        posOrderId: placed.posOrderId ?? null,
        orderNumber: placed.orderNumber ?? "",
        status: placed.status,
        total,
        items: bagItems.map((row) => ({
          name: row.dish.name,
          quantity: row.quantity,
          price: row.dish.price,
          extras: extrasLabel(row.extras) || undefined,
        })),
        placedAt: new Date().toISOString(),
      };
      setPlaced(appendPlacedOrder(tableNumber, snapshot));
      setResult(snapshot);
      setQty({});
      setExtrasById({});
      setBagOpen(false);
      setScreen("success");
      void loadHistory(guest.phone);
    });
  }

  if (result && screen === "success") {
    return (
      <CafeShell forceLight tone="order">
        <OrderSuccess
          orderNumber={result.orderNumber}
          tableNumber={tableNumber}
          status={result.status}
          items={result.items}
          total={result.total}
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
          posOrderId={result.posOrderId}
          orderNumber={result.orderNumber}
          status={result.status}
          tableNumber={tableNumber}
          items={result.items}
          total={result.total}
          placedAt={result.placedAt}
          onLiveUpdate={(order) => {
            setResult(order);
            setPlaced(upsertPlacedOrder(tableNumber, order));
          }}
          onBackToMenu={() => {
            setResult(null);
            setScreen("menu");
            setPlaced(readPlacedOrders(tableNumber));
          }}
        />
      </CafeShell>
    );
  }

  if (guestReady && !guest) {
    return (
      <CafeShell forceLight tone="order">
        <GuestGate onReady={setGuest} />
      </CafeShell>
    );
  }

  return (
    <CafeShell forceLight tone="order">
      <OrderHeader
        tableNumber={tableNumber}
        guestName={guest?.name}
        itemCount={itemCount}
        searchOpen={searchOpen}
        query={query}
        onSearchOpen={setSearchOpen}
        onQuery={setQuery}
        onOpenCart={() => setBagOpen(true)}
        onOpenOrders={openHistory}
      />
      <FilterChips options={categoryChips} value={category} onChange={setCategory} />

      {visitOrders.length > 0 ? (
        <div className="mx-3 mb-2 shrink-0 rounded-[20px] bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Your orders this visit</p>
            <button type="button" className="text-xs font-bold text-gray-700" onClick={openHistory}>
              All my orders
            </button>
          </div>
          <ul className="mt-2 max-h-36 space-y-2 overflow-y-auto">
            {visitOrders.map((order) => (
              <li key={`${order.orderNumber}-${order.placedAt}`}>
                <button
                  type="button"
                  className="w-full rounded-2xl bg-[#FAFAFA] px-3 py-2 text-left"
                  onClick={() => {
                    setResult(order);
                    setScreen("track");
                  }}
                >
                  <span className="flex items-center justify-between text-sm font-black text-gray-900">
                    <span>#{order.orderNumber}</span>
                    <span>₹{order.total}</span>
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold capitalize text-gray-500">
                    {normalizeOrderStatus(order.status)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {order.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
          {visible.map((dish, index) => (
            <MenuItemCard
              key={String(dish.id)}
              dish={dish}
              quantity={countOf(dish)}
              canOrder={orderingEnabled && Boolean(dish.posMenuItemId)}
              priority={index < 8}
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
          dishes={dishes}
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
        dishes={dishes}
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

      <GuestOrdersSheet
        open={historyOpen}
        loading={historyLoading}
        error={historyError}
        orders={history}
        guestName={guest?.name}
        onClose={() => setHistoryOpen(false)}
        onSelect={(order) => {
          setHistoryOpen(false);
          setResult({
            orderId: order.orderId,
            posOrderId: order.posOrderId,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            items: order.items,
            placedAt: order.placedAt,
          });
          setScreen("track");
        }}
      />
    </CafeShell>
  );
}
