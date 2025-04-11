
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateRestaurantProps {
  name: string;
  address?: string;
  phone?: string;
  logo_url?: string;
}

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
    const { error: userError } = await supabase
      .from('restaurant_users')
      .insert({
        restaurant_id: restaurant.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
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

export const addUserToRestaurant = async (
  restaurantId: string,
  email: string,
  role: 'manager' | 'staff'
) => {
  try {
    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      toast.error('Usuário não encontrado');
      throw userError;
    }

    // Then add the user to the restaurant
    const { error } = await supabase
      .from('restaurant_users')
      .insert({
        restaurant_id: restaurantId,
        user_id: userData.id,
        role: role
      });

    if (error) {
      // Check for duplicate key error
      if (error.code === '23505') {
        toast.error('Este usuário já está vinculado a este restaurante');
      } else {
        toast.error(`Erro ao adicionar usuário: ${error.message}`);
      }
      throw error;
    }

    toast.success('Usuário adicionado com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error adding user to restaurant:', error);
    return false;
  }
};

export const removeUserFromRestaurant = async (
  restaurantId: string,
  userId: string
) => {
  try {
    // Remove user from the restaurant
    const { error } = await supabase
      .from('restaurant_users')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao remover usuário: ${error.message}`);
      throw error;
    }

    toast.success('Usuário removido com sucesso!');
    return true;
  } catch (error) {
    console.error('Error removing user from restaurant:', error);
    return false;
  }
};

export const updateRestaurant = async (
  restaurantId: string,
  data: Partial<CreateRestaurantProps>
) => {
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
