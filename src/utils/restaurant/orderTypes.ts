
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
  payments?: Payment[];
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

// Payment types
export type PaymentMethod = 'cash' | 'credit' | 'debit' | 'pix' | 'other';

export interface Payment {
  id?: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  provided_amount?: number; // For cash payments to calculate change
  created_at?: string;
}

export interface PaymentSummary {
  total: number;
  paid: number;
  remaining: number;
  methods: {
    method: PaymentMethod;
    amount: number;
  }[];
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
