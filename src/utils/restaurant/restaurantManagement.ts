
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateRestaurantProps } from "./types";

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

    toast.success('Restaurante criado com sucesso!');
    return restaurant;
  } catch (error: any) {
    toast.error(`Erro ao criar restaurante: ${error.message}`);
    throw error;
  }
};

export const updateRestaurant = async (
  restaurantId: string,
  data: Partial<CreateRestaurantProps>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('restaurants')
      .update(data)
      .eq('id', restaurantId);

    if (error) {
      toast.error(`Erro ao atualizar restaurante: ${error.message}`);
      throw error;
    }

    toast.success('Restaurante atualizado com sucesso!');
    return true;
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return false;
  }
};
