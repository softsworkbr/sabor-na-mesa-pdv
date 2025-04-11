
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile, RestaurantUserInsert, UserRoleUpdate, UserWithRole } from "./types";

export const getUsersForRestaurant = async (restaurantId: string): Promise<UserWithRole[]> => {
  try {
    // Validate restaurantId is a valid UUID
    if (!restaurantId || typeof restaurantId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId)) {
      toast.error('ID do restaurante inválido');
      return [];
    }

    // First, we'll query profiles and restaurant_users separately since there's no direct relationship
    const { data: restaurantUsers, error: restaurantUsersError } = await supabase
      .from('restaurant_users')
      .select('user_id, role')
      .eq('restaurant_id', restaurantId);

    if (restaurantUsersError) {
      toast.error(`Erro ao buscar usuários: ${restaurantUsersError.message}`);
      console.error('Error fetching restaurant users:', restaurantUsersError);
      return [];
    }

    if (!restaurantUsers || restaurantUsers.length === 0) {
      return [];
    }

    // Get all user IDs
    const userIds = restaurantUsers.map(user => user.user_id);

    // Now fetch the profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, email')
      .in('id', userIds);

    if (profilesError) {
      toast.error(`Erro ao buscar perfis: ${profilesError.message}`);
      console.error('Error fetching profiles:', profilesError);
      return [];
    }

    // Combine the data
    return restaurantUsers.map(user => {
      const profile = profiles?.find(p => p.id === user.user_id) || {};
      
      return {
        id: user.user_id,
        email: profile.email,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: user.role as 'owner' | 'manager' | 'staff'
      };
    });
  } catch (error: any) {
    console.error('Error fetching users for restaurant:', error);
    return [];
  }
};

export const addUserToRestaurant = async (
  restaurantId: string,
  email: string,
  role: 'manager' | 'staff'
): Promise<boolean> => {
  try {
    // Validate restaurantId is a valid UUID
    if (!restaurantId || typeof restaurantId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId)) {
      toast.error('ID do restaurante inválido');
      return false;
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      toast.error('Email inválido');
      return false;
    }

    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();  // Use maybeSingle instead of single to avoid errors when no rows are found

    if (userError) {
      toast.error(`Erro ao buscar usuário: ${userError.message}`);
      console.error('Error finding user:', userError);
      return false;
    }

    if (!userData) {
      toast.error('Usuário não encontrado. Verifique o email informado.');
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
      console.error('Error adding user to restaurant:', error);
      return false;
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
    // Validate IDs
    if (!restaurantId || !userId) {
      toast.error('IDs inválidos');
      return false;
    }

    // Remove user from the restaurant
    const { error } = await supabase
      .from('restaurant_users')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao remover usuário: ${error.message}`);
      console.error('Error removing user from restaurant:', error);
      return false;
    }

    toast.success('Usuário removido com sucesso!');
    return true;
  } catch (error) {
    console.error('Error removing user from restaurant:', error);
    return false;
  }
};

export const updateUserRole = async (
  restaurantId: string,
  userId: string,
  role: 'manager' | 'staff'
): Promise<boolean> => {
  try {
    // Validate IDs
    if (!restaurantId || !userId) {
      toast.error('IDs inválidos');
      return false;
    }
    
    const updateData: UserRoleUpdate = { role };
    
    const { error } = await supabase
      .from('restaurant_users')
      .update(updateData)
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao atualizar função do usuário: ${error.message}`);
      console.error('Error updating user role:', error);
      return false;
    }

    toast.success('Função do usuário atualizada com sucesso!');
    return true;
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return false;
  }
};
