
import { supabase } from '@/integrations/supabase/client';
import { ProductVariation } from './productTypes';
import { toast } from 'sonner';

export const createProductVariation = async (data: Omit<ProductVariation, 'id'>) => {
  try {
    const { data: variation, error } = await supabase
      .from('product_variations')
      .insert({
        product_id: data.product_id,
        name: data.name,
        price: data.price,
        sort_order: data.sort_order || 0,
        active: data.active !== undefined ? data.active : true,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar variação: ${error.message}`);
      throw error;
    }

    toast.success('Variação criada com sucesso!');
    return variation;
  } catch (error: any) {
    console.error('Error creating product variation:', error);
    throw error;
  }
};

export const updateProductVariation = async (variationId: string, data: Partial<ProductVariation>) => {
  try {
    const { data: updatedVariation, error } = await supabase
      .from('product_variations')
      .update(data)
      .eq('id', variationId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar variação: ${error.message}`);
      throw error;
    }

    toast.success('Variação atualizada com sucesso!');
    return updatedVariation;
  } catch (error: any) {
    console.error('Error updating product variation:', error);
    throw error;
  }
};

export const deleteProductVariation = async (variationId: string) => {
  try {
    const { error } = await supabase
      .from('product_variations')
      .delete()
      .eq('id', variationId);

    if (error) {
      toast.error(`Erro ao excluir variação: ${error.message}`);
      throw error;
    }

    toast.success('Variação excluída com sucesso!');
  } catch (error: any) {
    console.error('Error deleting product variation:', error);
    throw error;
  }
};

export const getProductVariations = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching product variations:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching product variations:', error);
    return [];
  }
};
