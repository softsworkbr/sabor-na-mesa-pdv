import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderItem, CreateOrderItemProps, UpdateOrderItemProps } from '../orderTypes';
import { convertToOrderItem } from '../helpers/orderHelpers';

/**
 * Adds an item to an order
 */
export const addOrderItem = async (data: CreateOrderItemProps): Promise<OrderItem> => {
  try {
    console.log("Adding order item with data:", JSON.stringify(data, null, 2));
    
    // Prepare data for database insertion
    const insertData: any = {
      order_id: data.order_id,
      product_id: data.product_id,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      observation: data.observation === "" ? null : data.observation
    };
    
    // Não incluímos o campo variation_id no insertData porque ele não existe na tabela order_items
    // A informação da variação já está incluída no nome do produto (data.name)
    
    // Handle extras field
    if (data.extras && Array.isArray(data.extras) && data.extras.length > 0) {
      const cleanExtras = data.extras.map(extra => ({
        id: extra.id,
        name: extra.name,
        price: extra.price
      }));
      
      insertData.extras = cleanExtras;
    } else {
      insertData.extras = null;
    }
    
    console.log("Insert data prepared:", JSON.stringify(insertData, null, 2));
    
    const { data: orderItem, error } = await supabase
      .from('order_items')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error from Supabase:", error);
      throw error;
    }

    console.log("Order item created successfully:", orderItem);

    return convertToOrderItem(orderItem);
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
    
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

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

    if (error) throw error;
  } catch (error: any) {
    console.error('Error removing order item:', error);
    throw error;
  }
};
