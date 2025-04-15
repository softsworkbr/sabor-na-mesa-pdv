import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateTableProps, TableItem, UpdateTableProps } from "./tableTypes";

/**
 * Busca todas as mesas de um restaurante específico
 */
export const getTablesByRestaurant = async (restaurantId: string): Promise<TableItem[]> => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('number', { ascending: true });

    if (error) {
      toast.error(`Erro ao buscar mesas: ${error.message}`);
      throw error;
    }

    return data as TableItem[];
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    throw error;
  }
};

/**
 * Cria uma nova mesa para um restaurante
 */
export const createTable = async (data: CreateTableProps): Promise<TableItem> => {
  try {
    const { data: table, error } = await supabase
      .from('tables')
      .insert(data)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar mesa: ${error.message}`);
      throw error;
    }

    toast.success('Mesa criada com sucesso!');
    return table as TableItem;
  } catch (error: any) {
    console.error('Error creating table:', error);
    throw error;
  }
};

/**
 * Atualiza uma mesa existente
 */
export const updateTable = async (tableId: string, data: UpdateTableProps): Promise<TableItem> => {
  try {
    const { data: updatedTable, error } = await supabase
      .from('tables')
      .update(data)
      .eq('id', tableId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar mesa: ${error.message}`);
      throw error;
    }

    toast.success('Mesa atualizada com sucesso!');
    return updatedTable as TableItem;
  } catch (error: any) {
    console.error('Error updating table:', error);
    throw error;
  }
};

/**
 * Remove uma mesa existente
 */
export const deleteTable = async (tableId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      toast.error(`Erro ao remover mesa: ${error.message}`);
      throw error;
    }

    toast.success('Mesa removida com sucesso!');
  } catch (error: any) {
    console.error('Error deleting table:', error);
    throw error;
  }
};

/**
 * Busca uma mesa específica pelo ID
 */
export const getTableById = async (tableId: string): Promise<TableItem | null> => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .maybeSingle();

    if (error) {
      toast.error(`Erro ao buscar mesa: ${error.message}`);
      throw error;
    }

    return data as TableItem | null;
  } catch (error: any) {
    console.error('Error fetching table:', error);
    throw error;
  }
};

/**
 * Updates a table with customer name
 */
export const updateTableCustomerName = async (tableId: string, customerName: string | null): Promise<TableItem> => {
  try {
    const { data: updatedTable, error } = await supabase
      .from('tables')
      .update({ description: customerName })
      .eq('id', tableId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar nome do cliente: ${error.message}`);
      throw error;
    }

    return updatedTable as TableItem;
  } catch (error: any) {
    console.error('Error updating table customer name:', error);
    throw error;
  }
};
