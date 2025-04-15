import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Order, 
  OrderItem, 
  CreateOrderProps, 
  UpdateOrderProps, 
  CreateOrderItemProps, 
  UpdateOrderItemProps,
  ProductExtra,
  OrderPayment,
  PaymentMethod,
  CreateOrderPaymentProps
} from "./orderTypes";
import { 
  getCurrentCashRegister,
  createCashRegisterTransaction 
} from "./cashRegisterManagement";

/**
 * Helper function to convert database extras (JSON) to typed ProductExtra array
 */
const parseExtras = (extrasJson: any): ProductExtra[] | null => {
  if (!extrasJson) return null;
  
  console.log("Parsing extras:", extrasJson, "Type:", typeof extrasJson);
  
  try {
    // Se já for um array, retornar diretamente
    if (Array.isArray(extrasJson)) {
      console.log("Extras is already an array");
      return extrasJson as ProductExtra[];
    }
    
    // Se for uma string JSON, tentar fazer o parse
    if (typeof extrasJson === 'string') {
      console.log("Extras is a string, trying to parse");
      try {
        const parsed = JSON.parse(extrasJson);
        if (Array.isArray(parsed)) {
          console.log("Successfully parsed extras string to array");
          return parsed as ProductExtra[];
        }
      } catch (e) {
        console.error("Failed to parse extras JSON string:", e);
      }
    }
    
    // Se for um objeto com a estrutura esperada do Supabase
    if (typeof extrasJson === 'object' && extrasJson !== null) {
      console.log("Extras is an object, trying to convert");
      return [extrasJson] as ProductExtra[];
    }
    
    console.log("Could not parse extras, returning null");
    return null;
  } catch (error) {
    console.error("Error parsing extras:", error);
    return null;
  }
};

/**
 * Helper function to convert database item to OrderItem with proper types
 */
const convertToOrderItem = (item: any): OrderItem => {
  return {
    ...item,
    extras: parseExtras(item.extras)
  };
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
    
    // Convert items with proper type handling for extras
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
    
    // Convert items with proper type handling for extras
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
 * Adds an item to an order
 */
export const addOrderItem = async (data: CreateOrderItemProps): Promise<OrderItem> => {
  try {
    console.log("Adding order item with observation:", data.observation);
    console.log("Adding order item with extras:", data.extras);
    
    // Prepare data for database insertion
    const insertData: any = {
      order_id: data.order_id,
      product_id: data.product_id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      observation: data.observation === "" ? null : data.observation
    };
    
    // Handle extras field - make sure it's stored as JSON in the database
    if (data.extras && Array.isArray(data.extras) && data.extras.length > 0) {
      // Garantir que apenas as propriedades necessárias sejam incluídas
      const cleanExtras = data.extras.map(extra => ({
        id: extra.id,
        name: extra.name,
        price: extra.price
      }));
      
      // Converter para string JSON para garantir compatibilidade
      insertData.extras = cleanExtras;
      
      console.log("Extras being saved:", cleanExtras);
    } else {
      insertData.extras = null;
    }
    
    console.log("Insert data being sent to database:", insertData);
    
    const { data: orderItem, error } = await supabase
      .from('order_items')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database error when inserting item:", error);
      toast.error(`Erro ao adicionar item ao pedido: ${error.message}`);
      throw error;
    }

    console.log("Successfully added item:", orderItem);
    
    // Verificar se os extras foram salvos corretamente
    if (orderItem && orderItem.extras) {
      console.log("Extras saved in database:", orderItem.extras);
    }
    
    // Convert the returned item with properly typed extras
    const convertedItem = convertToOrderItem(orderItem);
    console.log("Converted item with extras:", convertedItem);
    
    return convertedItem;
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
    console.log("Updating order item:", itemId, "with data:", data);
    
    // Prepare update data
    const updateData: any = { ...data };
    
    // If observation is empty string, convert to null for database
    if (updateData.observation === '') {
      updateData.observation = null;
    }
    
    console.log("Update data being sent to database:", updateData);
    
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error("Database error when updating item:", error);
      toast.error(`Erro ao atualizar item: ${error.message}`);
      throw error;
    }

    console.log("Successfully updated item:", updatedItem);
    // Convert the returned item with properly typed extras
    return convertToOrderItem(updatedItem);
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

/**
 * Adiciona um pagamento ao pedido
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

    if (error) {
      toast.error(`Erro ao adicionar pagamento: ${error.message}`);
      throw error;
    }

    return payment as OrderPayment;
  } catch (error: any) {
    console.error('Error adding order payment:', error);
    throw error;
  }
};

/**
 * Obtém os métodos de pagamento disponíveis
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      toast.error(`Erro ao buscar métodos de pagamento: ${error.message}`);
      throw error;
    }

    return data as PaymentMethod[];
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

/**
 * Finaliza o pagamento de um pedido
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
        type: 'payment',
        payment_method_id: payment.payment_method_id,
        notes: `Pagamento do pedido #${orderId}`
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
