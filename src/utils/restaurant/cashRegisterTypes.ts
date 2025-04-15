
export interface CashRegister {
  id?: string;
  restaurant_id: string;
  opened_by: string;
  closed_by?: string | null;
  opening_balance: number;
  closing_balance?: number | null;
  opening_notes?: string | null;
  closing_notes?: string | null;
  opened_at?: string;
  closed_at?: string | null;
  status: 'open' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export interface CashRegisterTransaction {
  id?: string;
  cash_register_id: string;
  order_id?: string | null;
  order_payment_id?: string | null;
  amount: number;
  balance: number;
  type: 'payment' | 'withdrawal' | 'deposit';
  payment_method_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OpenCashRegisterProps {
  restaurant_id: string;
  opening_balance: number;
  opening_notes?: string;
}

export interface CloseCashRegisterProps {
  closing_balance: number;
  closing_notes?: string;
}
