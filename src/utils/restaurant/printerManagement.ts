
import { supabase } from "@/integrations/supabase/client";
import { PrinterConfig, CreatePrinterConfigProps } from "./types";

export const getPrinterConfigsByRestaurant = async (restaurantId: string): Promise<PrinterConfig[]> => {
  const { data, error } = await supabase
    .from('printer_configs')
    .select('*')
    .eq('restaurant_id', restaurantId);

  if (error) {
    console.error("Error fetching printer configs:", error);
    throw error;
  }

  return data || [];
};

export const createPrinterConfig = async (printerConfig: CreatePrinterConfigProps): Promise<PrinterConfig | null> => {
  const { data, error } = await supabase
    .from('printer_configs')
    .insert(printerConfig)
    .select()
    .single();

  if (error) {
    console.error("Error creating printer config:", error);
    throw error;
  }

  return data;
};

export const updatePrinterConfig = async (
  id: string, 
  updates: Partial<CreatePrinterConfigProps>
): Promise<PrinterConfig | null> => {
  const { data, error } = await supabase
    .from('printer_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error updating printer config:", error);
    throw error;
  }

  return data;
};

export const deletePrinterConfig = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('printer_configs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting printer config:", error);
    throw error;
  }

  return true;
};
