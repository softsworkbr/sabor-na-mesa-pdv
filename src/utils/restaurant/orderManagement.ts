import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Order, 
  CreateOrderProps, 
  UpdateOrderProps,
  OrderItem
} from './types/orderTypes';
import { convertToOrderItem } from './helpers/orderHelpers';
import { 
  addOrderItem as addItem,
  updateOrderItem as updateItem,
  removeOrderItem as removeItem
} from './services/orderItemsService';
import {
  addOrderPayment as addPayment,
  getPaymentMethodsList as getPaymentMethods
} from './services/paymentService';
import { 
  getCurrentCashRegister,
  createCashRegisterTransaction 
} from "./cashRegisterManagement";

export {
  addItem as addOrderItem,
  updateItem as updateOrderItem,
  removeItem as removeOrderItem,
  addPayment as addOrderPayment,
  getPaymentMethodsList as getPaymentMethods
};

/**
 * Creates a new order
 */
export const createOrder = async (data: CreateOrderProps): Promise<Order> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        ...data,
        status: data.status || 'active'
      })
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar pedido: ${error.message}`);
      throw error;
    }

    toast.success('Pedido criado com sucesso!');
    return order as Order;
  } catch (error: any) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Updates an existing order
 */
export const updateOrder = async (orderId: string, data: UpdateOrderProps): Promise<Order> => {
  try {
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(data)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar pedido: ${error.message}`);
      throw error;
    }

    return updatedOrder as Order;
  } catch (error: any) {
    console.error('Error updating order:', error);
    throw error;
  }
};

/**
 * Gets an order by ID with its items
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      toast.error(`Erro ao buscar pedido: ${error.message}`);
      throw error;
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      toast.error(`Erro ao buscar itens do pedido: ${itemsError.message}`);
      throw itemsError;
    }
    
    const typedItems = items ? items.map(convertToOrderItem) : [];

    return { ...order, items: typedItems } as Order;
  } catch (error: any) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

/**
 * Gets active orders for a table
 */
export const getOrderByTableId = async (tableId: string): Promise<Order | null> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast.error(`Erro ao buscar pedido da mesa: ${error.message}`);
      throw error;
    }

    if (!orders) {
      return null;
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orders.id);

    if (itemsError) {
      toast.error(`Erro ao buscar itens do pedido: ${itemsError.message}`);
      throw itemsError;
    }
    
    const typedItems = items ? items.map(convertToOrderItem) : [];

    return { ...orders, items: typedItems } as Order;
  } catch (error: any) {
    console.error('Error fetching order for table:', error);
    throw error;
  }
};

/**
 * Gets all orders with specified status
 */
export const getOrders = async (status?: string): Promise<Order[]> => {
  try {
    let query = supabase
      .from('orders')
      .select('*');
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao buscar pedidos: ${error.message}`);
      throw error;
    }

    return data as Order[];
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Completes an order
 */
export const completeOrder = async (orderId: string): Promise<Order> => {
  return updateOrder(orderId, { status: 'completed' });
};

/**
 * Cancels an order
 */
export const cancelOrder = async (orderId: string): Promise<Order> => {
  return updateOrder(orderId, { status: 'cancelled' });
};

/**
 * Calculates order total and service fee
 */
export const calculateOrderTotal = async (orderId: string, serviceFeePercent: number = 10): Promise<void> => {
  try {
    // Get all items for the order
    const { data: items, error } = await supabase
      .from('order_items')
      .select('price, quantity')
      .eq('order_id', orderId);

    if (error) {
      toast.error(`Erro ao calcular total: ${error.message}`);
      throw error;
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate service fee
    const serviceFee = (subtotal * serviceFeePercent) / 100;
    
    // Update order with totals
    await updateOrder(orderId, {
      total_amount: subtotal + serviceFee,
      service_fee: serviceFee
    });
  } catch (error: any) {
    console.error('Error calculating order total:', error);
    throw error;
  }
};

/**
 * Finalizes order payment
 */
export const completeOrderPayment = async (
  orderId: string, 
  includeServiceFee: boolean = true,
  serviceFeeAmount?: number
): Promise<void> => {
  try {
    // Get the current cash register
    const { data: restaurant } = await supabase
      .from('restaurant_users')
      .select('restaurant_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const currentRegister = await getCurrentCashRegister(restaurant.restaurant_id);
    if (!currentRegister) {
      throw new Error('Não há caixa aberto. Por favor, abra o caixa antes de processar pagamentos.');
    }

    // Update order with cash register reference and status
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        service_fee: includeServiceFee && serviceFeeAmount ? serviceFeeAmount : 0,
        cash_register_id: currentRegister.id
      })
      .eq('id', orderId);

    if (error) throw error;

    // Create transaction for each payment
    const { data: payments, error: paymentsError } = await supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', orderId);

    if (paymentsError) throw paymentsError;

    for (const payment of payments || []) {
      const transaction = await createCashRegisterTransaction({
        cash_register_id: currentRegister.id,
        order_id: orderId,
        order_payment_id: payment.id,
        amount: payment.amount,
        balance: 0, // This value will be calculated by the database trigger
        type: 'payment',
        payment_method_id: payment.payment_method_id,
        notes: `Pagamento do pedido #${orderId.substring(0, 6)}`
      });

      // Update order payment with transaction reference
      await supabase
        .from('order_payments')
        .update({ cash_register_transaction_id: transaction.id })
        .eq('id', payment.id);
    }

    toast.success('Pagamento finalizado com sucesso!');
  } catch (error: any) {
    console.error('Error completing order payment:', error);
    toast.error(error.message);
    throw error;
  }
};

/**
 * Updates the printed status of an order item
 */
export const updateOrderItemPrintStatus = async (itemId: string, printed: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('order_items')
      .update({
        printed_at: printed ? new Date().toISOString() : null
      })
      .eq('id', itemId);

    if (error) {
      toast.error(`Erro ao atualizar status de impressão: ${error.message}`);
      throw error;
    }

    toast.success(printed ? 'Item marcado como impresso' : 'Item desmarcado');
  } catch (error: any) {
    console.error('Error updating order item print status:', error);
    throw error;
  }
};
