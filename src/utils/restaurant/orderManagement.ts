
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Order, 
  OrderItem, 
  CreateOrderProps, 
  UpdateOrderProps, 
  CreateOrderItemProps, 
  UpdateOrderItemProps 
} from "./orderTypes";

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
        // No rows returned
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

    return { ...order, items: items || [] } as Order;
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

    return { ...orders, items: items || [] } as Order;
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
 * Adds an item to an order
 */
export const addOrderItem = async (data: CreateOrderItemProps): Promise<OrderItem> => {
  try {
    // Ensure observation is properly passed to the database
    const { data: orderItem, error } = await supabase
      .from('order_items')
      .insert({
        order_id: data.order_id,
        product_id: data.product_id,
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        observation: data.observation || null // Explicitly handle null for empty observation
      })
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao adicionar item ao pedido: ${error.message}`);
      throw error;
    }

    return orderItem as OrderItem;
  } catch (error: any) {
    console.error('Error adding order item:', error);
    throw error;
  }
};

/**
 * Updates an order item
 */
export const updateOrderItem = async (itemId: string, data: UpdateOrderItemProps): Promise<OrderItem> => {
  try {
    // Ensure observation is properly handled during updates
    const updateData: UpdateOrderItemProps = { ...data };
    
    // If observation is empty string, convert to null for database
    if (updateData.observation === '') {
      updateData.observation = null;
    }
    
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar item: ${error.message}`);
      throw error;
    }

    return updatedItem as OrderItem;
  } catch (error: any) {
    console.error('Error updating order item:', error);
    throw error;
  }
};

/**
 * Removes an item from an order
 */
export const removeOrderItem = async (itemId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error(`Erro ao remover item: ${error.message}`);
      throw error;
    }
  } catch (error: any) {
    console.error('Error removing order item:', error);
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
