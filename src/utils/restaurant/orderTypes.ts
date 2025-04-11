
import { Product } from "./productTypes";

export type OrderStatus = "active" | "completed" | "cancelled" | "pending";

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string;
}

export interface Order {
  id?: string;
  table_id: string;
  customer_name?: string;
  status: OrderStatus;
  total_amount?: number;
  service_fee?: number;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface CreateOrderProps {
  table_id: string;
  customer_name?: string;
  status?: OrderStatus;
}

export interface UpdateOrderProps {
  customer_name?: string;
  status?: OrderStatus;
  total_amount?: number;
  service_fee?: number;
}

export interface CreateOrderItemProps {
  order_id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string | null;
}

export interface UpdateOrderItemProps {
  quantity?: number;
  observation?: string | null;
}
