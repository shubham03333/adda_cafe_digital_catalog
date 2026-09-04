import { isCancelledStatus } from "@/lib/order-display";

export type SessionOrderItem = {
  name: string;
  quantity: number;
  price: number;
  extras?: string;
};

export type SessionOrder = {
  orderId: string | null;
  posOrderId?: string | null;
  orderNumber: string;
  status: string;
  total: number;
  items: SessionOrderItem[];
  placedAt: string;
};

function storageKey(tableNumber: number) {
  return `adda-placed-orders:t${tableNumber}`;
}

export function writePlacedOrders(tableNumber: number, orders: SessionOrder[]) {
  if (typeof window === "undefined") return [];
  const visible = orders.filter((item) => !isCancelledStatus(item.status)).slice(0, 20);
  sessionStorage.setItem(storageKey(tableNumber), JSON.stringify(visible));
  return visible;
}

export function readPlacedOrders(tableNumber: number): SessionOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(storageKey(tableNumber));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionOrder[];
    return Array.isArray(parsed) ? parsed.filter((item) => !isCancelledStatus(item.status)) : [];
  } catch {
    return [];
  }
}

export function upsertPlacedOrder(tableNumber: number, order: SessionOrder) {
  const current = readPlacedOrders(tableNumber);
  if (isCancelledStatus(order.status)) {
    const next = current.filter(
      (item) =>
        !(order.orderId && item.orderId === order.orderId) &&
        !(order.posOrderId && item.posOrderId === order.posOrderId) &&
        !(order.orderNumber && item.orderNumber === order.orderNumber)
    );
    return writePlacedOrders(tableNumber, next);
  }
  const index = current.findIndex(
    (item) =>
      (order.orderId && item.orderId === order.orderId) ||
      (order.posOrderId && item.posOrderId === order.posOrderId) ||
      (order.orderNumber && item.orderNumber === order.orderNumber)
  );
  const next =
    index >= 0
      ? current.map((item, i) => (i === index ? { ...item, ...order } : item))
      : [order, ...current];
  return writePlacedOrders(tableNumber, next);
}

export function appendPlacedOrder(tableNumber: number, order: SessionOrder) {
  return writePlacedOrders(tableNumber, [order, ...readPlacedOrders(tableNumber)]);
}
