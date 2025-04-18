import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const getUsersForRestaurant = async (restaurantId: string) => {
  try {
    const { data, error } = await supabase
      .from('restaurant_users')
      .select('*, profiles(id, full_name, email)')
      .eq('restaurant_id', restaurantId);

    if (error) {
      toast.error(`Erro ao buscar usuários: ${error.message}`);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const addUserToRestaurant = async (
  restaurantId: string,
  userId: string,
  userRole: 'owner' | 'manager' | 'staff' = 'staff'
) => {
  try {
    const { error } = await supabase
      .from('restaurant_users')
      .insert({
        restaurant_id: restaurantId,
        user_id: userId,
        role: userRole
      });

    if (error) {
      toast.error(`Erro ao adicionar usuário: ${error.message}`);
      throw error;
    }

    toast.success('Usuário adicionado com sucesso!');
  } catch (error: any) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const removeUserFromRestaurant = async (restaurantId: string, userId: string) => {
  try {
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
  } catch (error: any) {
    console.error('Error removing user:', error);
    throw error;
  }
};

export const updateUserRole = async (restaurantId: string, userId: string, role: 'owner' | 'manager' | 'staff') => {
  try {
    const { error } = await supabase
      .from('restaurant_users')
      .update({ role })
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId);

    if (error) {
      toast.error(`Erro ao atualizar role do usuário: ${error.message}`);
      throw error;
    }

    toast.success('Role do usuário atualizado com sucesso!');
  } catch (error: any) {
    console.error('Error updating user role:', error);
    throw error;
  }
};
