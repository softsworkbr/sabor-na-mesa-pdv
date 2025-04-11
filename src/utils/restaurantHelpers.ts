
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
      } as any)
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
      } as any);

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

export interface UserWithRole {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'owner' | 'manager' | 'staff';
}

export const getUsersForRestaurant = async (restaurantId: string): Promise<UserWithRole[]> => {
  try {
    // Get all users associated with this restaurant
    const { data, error } = await supabase
      .from('restaurant_users')
      .select(`
        user_id,
        role,
        profiles:user_id(id, email, username, full_name, avatar_url)
      `)
      .eq('restaurant_id', restaurantId);

    if (error) {
      toast.error(`Erro ao buscar usuários: ${error.message}`);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data into a more usable format
    return data.map(item => ({
      id: item.profiles?.id || item.user_id,
      email: item.profiles?.email,
      username: item.profiles?.username,
      full_name: item.profiles?.full_name,
      avatar_url: item.profiles?.avatar_url,
      role: item.role
    }));
  } catch (error: any) {
    console.error('Error fetching users for restaurant:', error);
    return [];
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
      } as any);

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
      .update(data as any)
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

export const updateUserRole = async (
  restaurantId: string,
  userId: string,
  role: 'manager' | 'staff'
) => {
  try {
    const { error } = await supabase
      .from('restaurant_users')
      .update({ role } as any)
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao atualizar função do usuário: ${error.message}`);
      throw error;
    }

    toast.success('Função do usuário atualizada com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return false;
  }
};
