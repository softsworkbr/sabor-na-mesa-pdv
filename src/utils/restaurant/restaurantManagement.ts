import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateRestaurantProps } from "./types";
import { createTable } from "./tableManagement";
import { TableStatus } from "./tableTypes";

export const createRestaurant = async (data: CreateRestaurantProps) => {
  try {
    // First create the restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        logo_url: data.logo_url || null,
      })
      .select()
      .single();

    if (restaurantError) {
      throw restaurantError;
    }

    // Then add the current user as an owner of the restaurant
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { error: userError } = await supabase
      .from('restaurant_users')
      .insert({
        restaurant_id: restaurant.id,
        user_id: userId,
        role: 'owner'
      });

    if (userError) {
      // If there's an error, try to rollback by deleting the restaurant
      await supabase.from('restaurants').delete().eq('id', restaurant.id);
      throw userError;
    }

    // Add 30 default tables to the restaurant
    await createDefaultTables(restaurant.id);
    
    // Add default product categories to the restaurant
    await createDefaultCategories(restaurant.id);

    toast.success('Restaurante criado com sucesso!');
    return restaurant;
  } catch (error: any) {
    toast.error(`Erro ao criar restaurante: ${error.message}`);
    throw error;
  }
};

// Function to create 30 default tables for a new restaurant
const createDefaultTables = async (restaurantId: string) => {
  try {
    // Create tables in batches to avoid overwhelming the database
    const promises = [];
    
    for (let i = 1; i <= 30; i++) {
      promises.push(
        createTable({
          number: i,
          status: "free" as TableStatus,
          restaurant_id: restaurantId,
          description: `Mesa ${i}`
        })
      );
    }

    await Promise.all(promises);
    toast.success("30 mesas padrão foram criadas com sucesso!");
  } catch (error: any) {
    console.error("Error creating default tables:", error);
    toast.error("As mesas foram criadas parcialmente ou não foram criadas.");
    // We don't throw here to avoid rolling back the restaurant creation
    // The user can add tables manually if this fails
  }
};

// Function to create default product categories for a new restaurant
const createDefaultCategories = async (restaurantId: string) => {
  try {
    const defaultCategories = [
      { name: "Entradas", description: "Aperitivos e entradas", sort_order: 0, has_extras: false },
      { name: "Pratos Principais", description: "Pratos principais do cardápio", sort_order: 1, has_extras: true },
      { name: "Sobremesas", description: "Sobremesas e doces", sort_order: 2, has_extras: false },
      { name: "Bebidas", description: "Refrigerantes, sucos e bebidas não alcoólicas", sort_order: 3, has_extras: false },
      { name: "Bebidas Alcoólicas", description: "Cervejas, vinhos e destilados", sort_order: 4, has_extras: false },
      { name: "Porções", description: "Porções para compartilhar", sort_order: 5, has_extras: true },
      { name: "Lanches", description: "Lanches e sanduíches", sort_order: 6, has_extras: true }
    ];

    const categories = defaultCategories.map(category => ({
      ...category,
      restaurant_id: restaurantId,
      active: true, // All categories are enabled by default
    }));

    const { error } = await supabase
      .from('product_categories')
      .insert(categories);

    if (error) {
      throw error;
    }
    
    toast.success("Categorias padrão criadas com sucesso!");
  } catch (error: any) {
    console.error("Error creating default categories:", error);
    toast.error("As categorias foram criadas parcialmente ou não foram criadas.");
    // We don't throw here to avoid rolling back the restaurant creation
  }
};

export const updateRestaurant = async (
  restaurantId: string,
  data: Partial<CreateRestaurantProps>
) => {
  try {
    const { data: updatedRestaurant, error } = await supabase
      .from('restaurants')
      .update(data)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar restaurante: ${error.message}`);
      throw error;
    }

    toast.success('Restaurante atualizado com sucesso!');
    return updatedRestaurant;
  } catch (error: any) {
    console.error('Error updating restaurant:', error);
    throw error;
  }
};

// Product related functions

export type CreateProductProps = {
  name: string;
  description?: string;
  price: number;
  category_id: string;
  restaurant_id: string;
  image_url?: string;
  active?: boolean;
};

export type UpdateProductProps = Partial<CreateProductProps>;

export const createProduct = async (data: CreateProductProps) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: data.name,
        description: data.description || null,
        price: data.price,
        category_id: data.category_id,
        restaurant_id: data.restaurant_id,
        image_url: data.image_url || null,
        active: data.active !== undefined ? data.active : true,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar produto: ${error.message}`);
      throw error;
    }

    toast.success('Produto criado com sucesso!');
    return product;
  } catch (error: any) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, data: UpdateProductProps) => {
  try {
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
      throw error;
    }

    toast.success('Produto atualizado com sucesso!');
    return updatedProduct;
  } catch (error: any) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast.error(`Erro ao excluir produto: ${error.message}`);
      throw error;
    }

    toast.success('Produto excluído com sucesso!');
  } catch (error: any) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getProductsByCategory = async (restaurantId: string, categoryId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('category_id', categoryId)
      .order('name');

    if (error) {
      toast.error(`Erro ao buscar produtos: ${error.message}`);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductsByRestaurant = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_categories(name)')
      .eq('restaurant_id', restaurantId)
      .order('name');

    if (error) {
      toast.error(`Erro ao buscar produtos: ${error.message}`);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Product extra related functions

export type CreateProductExtraProps = {
  name: string;
  price: number;
  description?: string;
  category_id?: string;
  restaurant_id: string;
  active?: boolean;
};

export type UpdateProductExtraProps = Partial<CreateProductExtraProps>;

export const createProductExtra = async (data: CreateProductExtraProps) => {
  try {
    const { data: extra, error } = await supabase
      .from('product_extras')
      .insert({
        name: data.name,
        description: data.description || null,
        price: data.price,
        category_id: data.category_id || null,
        restaurant_id: data.restaurant_id,
        active: data.active !== undefined ? data.active : true,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar adicional: ${error.message}`);
      throw error;
    }

    toast.success('Adicional criado com sucesso!');
    return extra;
  } catch (error: any) {
    console.error('Error creating product extra:', error);
    throw error;
  }
};

export const updateProductExtra = async (extraId: string, data: UpdateProductExtraProps) => {
  try {
    const { data: updatedExtra, error } = await supabase
      .from('product_extras')
      .update(data)
      .eq('id', extraId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar adicional: ${error.message}`);
      throw error;
    }

    toast.success('Adicional atualizado com sucesso!');
    return updatedExtra;
  } catch (error: any) {
    console.error('Error updating product extra:', error);
    throw error;
  }
};

export const deleteProductExtra = async (extraId: string) => {
  try {
    const { error } = await supabase
      .from('product_extras')
      .delete()
      .eq('id', extraId);

    if (error) {
      toast.error(`Erro ao excluir adicional: ${error.message}`);
      throw error;
    }

    toast.success('Adicional excluído com sucesso!');
  } catch (error: any) {
    console.error('Error deleting product extra:', error);
    throw error;
  }
};

export const getProductExtrasByRestaurant = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase
      .from('product_extras')
      .select('*, product_categories(name)')
      .eq('restaurant_id', restaurantId)
      .order('name');

    if (error) {
      toast.error(`Erro ao buscar adicionais: ${error.message}`);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching product extras:', error);
    throw error;
  }
};

export const getProductExtrasByCategory = async (restaurantId: string, categoryId: string) => {
  try {
    const { data, error } = await supabase
      .from('product_extras')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('category_id', categoryId)
      .order('name');

    if (error) {
      toast.error(`Erro ao buscar adicionais: ${error.message}`);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching product extras:', error);
    throw error;
  }
};

export const assignExtrasToProduct = async (productId: string, extraIds: string[]) => {
  try {
    // First, remove existing relations
    const { error: deleteError } = await supabase
      .from('product_to_extras')
      .delete()
      .eq('product_id', productId);
    
    if (deleteError) {
      toast.error(`Erro ao atualizar adicionais: ${deleteError.message}`);
      throw deleteError;
    }

    if (extraIds.length === 0) {
      return;
    }

    // Then, add new relations
    const relations = extraIds.map(extraId => ({
      product_id: productId,
      extra_id: extraId
    }));

    const { error } = await supabase
      .from('product_to_extras')
      .insert(relations);

    if (error) {
      toast.error(`Erro ao atribuir adicionais: ${error.message}`);
      throw error;
    }

    toast.success('Adicionais atribuídos com sucesso!');
  } catch (error: any) {
    console.error('Error assigning extras to product:', error);
    throw error;
  }
};

export const getProductExtras = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('product_to_extras')
      .select('extra_id, product_extras(*)')
      .eq('product_id', productId);

    if (error) {
      console.error('Error fetching product extras:', error);
      return [];
    }

    return data.map(item => item.product_extras) || [];
  } catch (error: any) {
    console.error('Error fetching product extras:', error);
    return [];
  }
};

// Product variations related functions
export interface CreateProductVariationProps {
  name: string;
  price: number;
  product_id: string;
  restaurant_id: string;
  active?: boolean;
  sort_order?: number;
}

export interface UpdateProductVariationProps {
  name?: string;
  price?: number;
  active?: boolean;
  sort_order?: number;
  product_id?: string;
  restaurant_id?: string;
}

export const createProductVariation = async (data: CreateProductVariationProps) => {
  try {
    const { data: variation, error } = await supabase
      .from('product_variations')
      .insert({
        name: data.name,
        price: data.price,
        product_id: data.product_id,
        restaurant_id: data.restaurant_id,
        active: data.active !== undefined ? data.active : true,
        sort_order: data.sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao criar variação: ${error.message}`);
      throw error;
    }

    // Update the product to indicate it has variations
    const { error: productError } = await supabase
      .from('products')
      .update({ has_variations: true })
      .eq('id', data.product_id);

    if (productError) {
      console.error('Error updating product has_variations flag:', productError);
    }

    toast.success('Variação criada com sucesso!');
    return variation;
  } catch (error: any) {
    console.error('Error creating product variation:', error);
    throw error;
  }
};

export const updateProductVariation = async (variationId: string, data: UpdateProductVariationProps) => {
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
    // First, get the variation to know which product it belongs to
    const { data: variation, error: getError } = await supabase
      .from('product_variations')
      .select('product_id')
      .eq('id', variationId)
      .single();

    if (getError) {
      toast.error(`Erro ao buscar variação: ${getError.message}`);
      throw getError;
    }

    // Delete the variation
    const { error } = await supabase
      .from('product_variations')
      .delete()
      .eq('id', variationId);

    if (error) {
      toast.error(`Erro ao excluir variação: ${error.message}`);
      throw error;
    }

    // Check if this was the last variation for the product
    const { data: remainingVariations, error: countError } = await supabase
      .from('product_variations')
      .select('id')
      .eq('product_id', variation.product_id);

    if (countError) {
      console.error('Error counting remaining variations:', countError);
    } else if (remainingVariations.length === 0) {
      // If no variations remain, update the product
      const { error: updateError } = await supabase
        .from('products')
        .update({ has_variations: false })
        .eq('id', variation.product_id);

      if (updateError) {
        console.error('Error updating product has_variations flag:', updateError);
      }
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
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error(`Erro ao buscar variações: ${error.message}`);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching product variations:', error);
    throw error;
  }
};
