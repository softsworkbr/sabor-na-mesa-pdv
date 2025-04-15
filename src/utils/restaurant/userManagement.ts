import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile, RestaurantUserInsert, UserRoleUpdate, UserWithRole } from "./types";

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
      // Ensure profiles is treated as an object with expected properties
      const profile = item.profiles as Profile || {} as Profile;
      
      return {
        id: profile.id || item.user_id,
        email: profile.email || '',
        username: profile.username || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        role: item.role as 'owner' | 'manager' | 'staff'
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
    // Buscar o usuário pelo email na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', email)  // Usar ilike para busca case-insensitive
      .maybeSingle();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      toast.error('Erro ao verificar usuário. Tente novamente.');
      return false;
    }

    let userId: string;

    if (!profileData) {
      // Se não encontrou o perfil, informar que o email precisa estar cadastrado
      toast.error('Usuário não encontrado. O email informado precisa estar cadastrado no sistema antes de ser vinculado ao restaurante.');
      toast.info('Peça ao usuário que faça login no sistema pelo menos uma vez antes de tentar vinculá-lo.');
      return false;
    } else {
      userId = profileData.id;
    }

    // Se encontrou o perfil, vincular ao restaurante
    const insertData: RestaurantUserInsert = {
      restaurant_id: restaurantId,
      user_id: userId,
      role
    };
    
    const { error } = await supabase
      .from('restaurant_users')
      .insert(insertData);

    if (error) {
      // Verificar erro de chave duplicada
      if (error.code === '23505') {
        toast.error('Este usuário já está vinculado a este restaurante');
      } else {
        console.error('Erro ao adicionar usuário:', error);
        toast.error(`Erro ao adicionar usuário: ${error.message}`);
      }
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
