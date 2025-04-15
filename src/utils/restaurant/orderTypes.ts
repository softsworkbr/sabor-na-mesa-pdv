import { Product } from "./productTypes";

export type OrderStatus = "active" | "completed" | "cancelled" | "pending";

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  observation?: string | null;
  extras?: ProductExtra[] | null;
  printed_at?: string | null;
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
  extras?: ProductExtra[] | null;
}

export interface UpdateOrderItemProps {
  quantity?: number;
  observation?: string | null;
  extras?: ProductExtra[] | null;
}

// Product extra type
export interface ProductExtra {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  category_id?: string | null;
  restaurant_id: string;
  active: boolean;
}

// Extra creation and update types
export interface CreateProductExtraProps {
  name: string;
  price: number;
  description?: string | null;
  category_id?: string | null;
  restaurant_id: string;
  active?: boolean;
}

export interface UpdateProductExtraProps {
  name?: string;
  price?: number;
  description?: string | null;
  category_id?: string | null;
  active?: boolean;
}

// Payment types
export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface OrderPayment {
  id?: string;
  order_id: string;
  payment_method_id: string;
  amount: number;
  include_service_fee: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderPaymentProps {
  order_id: string;
  payment_method_id: string;
  amount: number;
  include_service_fee?: boolean;
}
