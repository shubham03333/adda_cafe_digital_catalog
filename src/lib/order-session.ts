export type SessionOrderItem = {
  name: string;
  quantity: number;
  price: number;
  extras?: string;
};

export type SessionOrder = {
  orderId: string | null;
  orderNumber: string;
  status: string;
  total: number;
  items: SessionOrderItem[];
  placedAt: string;
};

function storageKey(tableNumber: number) {
  return `adda-placed-orders:t${tableNumber}`;
}

export function readPlacedOrders(tableNumber: number): SessionOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(storageKey(tableNumber));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendPlacedOrder(tableNumber: number, order: SessionOrder) {
  const next = [order, ...readPlacedOrders(tableNumber)].slice(0, 20);
  sessionStorage.setItem(storageKey(tableNumber), JSON.stringify(next));
  return next;
}
