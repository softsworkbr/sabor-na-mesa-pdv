
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

// Define the profile interface to match expected structure
interface Profile {
  id?: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

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
        profiles(id, username, full_name, avatar_url, email)
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
    return data.map(item => {
      // Handle potential null profiles with proper typing
      const profile = (item.profiles || {}) as Profile;
      
      return {
        id: profile.id || item.user_id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: item.role as 'owner' | 'manager' | 'staff'
      };
    });
  } catch (error: any) {
    console.error('Error fetching users for restaurant:', error);
    return [];
  }
};

// Define specific type for restaurant user insert
type RestaurantUserInsert = {
  restaurant_id: string;
  user_id: string;
  role: 'manager' | 'staff';
}

export const addUserToRestaurant = async (
  restaurantId: string,
  email: string,
  role: 'manager' | 'staff'
): Promise<boolean> => {
  try {
    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();  // Use maybeSingle instead of single to avoid errors when no rows are found

    if (userError || !userData) {
      toast.error('Usuário não encontrado. Verifique o email informado.');
      if (userError) console.error('Error finding user:', userError);
      return false;
    }

    // Then add the user to the restaurant
    const insertData: RestaurantUserInsert = {
      restaurant_id: restaurantId,
      user_id: userData.id,
      role
    };
    
    const { error } = await supabase
      .from('restaurant_users')
      .insert(insertData);

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
): Promise<boolean> => {
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

// Define type for user role update
type UserRoleUpdate = {
  role: 'manager' | 'staff';
}

export const updateUserRole = async (
  restaurantId: string,
  userId: string,
  role: 'manager' | 'staff'
): Promise<boolean> => {
  try {
    const updateData: UserRoleUpdate = { role };
    
    const { error } = await supabase
      .from('restaurant_users')
      .update(updateData)
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
