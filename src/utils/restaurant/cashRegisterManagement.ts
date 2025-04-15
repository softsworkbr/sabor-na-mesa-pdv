import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CashRegister, CashRegisterTransaction, OpenCashRegisterProps, CloseCashRegisterProps } from "./cashRegisterTypes";

export const openCashRegister = async (data: OpenCashRegisterProps): Promise<CashRegister> => {
  try {
    const { data: register, error } = await supabase
      .from('cash_registers')
      .insert({
        restaurant_id: data.restaurant_id,
        opened_by: (await supabase.auth.getUser()).data.user?.id,
        opening_balance: data.opening_balance,
        opening_notes: data.opening_notes,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Caixa aberto com sucesso!');
    // Type assertion to ensure the status is of type "open" | "closed"
    return register as CashRegister;
  } catch (error: any) {
    console.error('Error opening cash register:', error);
    toast.error(`Erro ao abrir caixa: ${error.message}`);
    throw error;
  }
};

export const closeCashRegister = async (registerId: string, data: CloseCashRegisterProps): Promise<CashRegister> => {
  try {
    const { data: register, error } = await supabase
      .from('cash_registers')
      .update({
        closed_by: (await supabase.auth.getUser()).data.user?.id,
        closing_balance: data.closing_balance,
        closing_notes: data.closing_notes,
        closed_at: new Date().toISOString(),
        status: 'closed'
      })
      .eq('id', registerId)
      .select()
      .single();

    if (error) throw error;
    
    toast.success('Caixa fechado com sucesso!');
    // Type assertion to ensure the status is of type "open" | "closed"
    return register as CashRegister;
  } catch (error: any) {
    console.error('Error closing cash register:', error);
    toast.error(`Erro ao fechar caixa: ${error.message}`);
    throw error;
  }
};

export const getCurrentCashRegister = async (restaurantId: string): Promise<CashRegister | null> => {
  try {
    const { data: register, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'open')
      .maybeSingle();

    if (error) throw error;
    // Type assertion to ensure the status is of type "open" | "closed"
    return register as CashRegister | null;
  } catch (error: any) {
    console.error('Error getting current cash register:', error);
    throw error;
  }
};

export const getCashRegisterById = async (registerId: string): Promise<CashRegister | null> => {
  try {
    const { data: register, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('id', registerId)
      .maybeSingle();

    if (error) throw error;
    return register as CashRegister | null;
  } catch (error: any) {
    console.error('Error getting cash register by ID:', error);
    throw error;
  }
};

export const getClosedCashRegisters = async (restaurantId: string, limit = 10): Promise<CashRegister[]> => {
  try {
    const { data: registers, error } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return registers as CashRegister[];
  } catch (error: any) {
    console.error('Error getting closed cash registers:', error);
    throw error;
  }
};

export const createCashRegisterTransaction = async (
  data: Omit<CashRegisterTransaction, 'id' | 'created_at' | 'updated_at'>
): Promise<CashRegisterTransaction> => {
  try {
    const { data: transaction, error } = await supabase
      .from('cash_register_transactions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    // Type assertion to ensure the type is of type "payment" | "withdrawal" | "deposit"
    return transaction as CashRegisterTransaction;
  } catch (error: any) {
    console.error('Error creating cash register transaction:', error);
    throw error;
  }
};

export const getCashRegisterTransactions = async (
  registerId: string
): Promise<CashRegisterTransaction[]> => {
  try {
    const { data: transactions, error } = await supabase
      .from('cash_register_transactions')
      .select('*')
      .eq('cash_register_id', registerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    // Type assertion to ensure the type is of type "payment" | "withdrawal" | "deposit" for each transaction
    return transactions as CashRegisterTransaction[];
  } catch (error: any) {
    console.error('Error getting cash register transactions:', error);
    throw error;
  }
};
