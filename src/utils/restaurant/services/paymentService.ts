
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderPayment, CreateOrderPaymentProps, PaymentMethod } from '../types/orderTypes';

/**
 * Adds a payment to an order
 */
export const addOrderPayment = async (data: CreateOrderPaymentProps): Promise<OrderPayment> => {
  try {
    const { data: payment, error } = await supabase
      .from('order_payments')
      .insert({
        order_id: data.order_id,
        payment_method_id: data.payment_method_id,
        amount: data.amount,
        include_service_fee: data.include_service_fee !== undefined ? data.include_service_fee : true
      })
      .select()
      .single();

    if (error) throw error;

    return payment as OrderPayment;
  } catch (error: any) {
    console.error('Error adding order payment:', error);
    throw error;
  }
};

/**
 * Gets available payment methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;

    return data as PaymentMethod[];
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};
