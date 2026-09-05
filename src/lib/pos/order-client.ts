import { posFetch } from "@/lib/pos/client";

export type PosOrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type SubmitOrderPayload = {
  idempotency_key: string;
  source: "digital_catalog";
  order_type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  table_code?: string;
  items: PosOrderItem[];
  total: number;
  customer_ref?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  offer_code?: string;
};

export type PosOrderCreated = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
};

export type PosOrderStatus = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  items: PosOrderItem[];
  total: number;
  table_code: string | null;
  updated_time: string | null;
};

export async function submitOrderToPos(payload: SubmitOrderPayload) {
  return posFetch<PosOrderCreated>("/api/integrations/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrderStatus(posOrderId: string) {
  return posFetch<PosOrderStatus>(`/api/integrations/orders/${encodeURIComponent(posOrderId)}`);
}

export async function getOrderStatusByNumber(orderNumber: string) {
  return posFetch<PosOrderStatus>(
    `/api/integrations/orders/by-number?order_number=${encodeURIComponent(orderNumber)}`
  );
}
