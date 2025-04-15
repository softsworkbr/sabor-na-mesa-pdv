import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile, RestaurantUserInsert, UserRoleUpdate, UserWithRole } from "./types";
import { sendRestaurantInviteEmail } from "@/utils/emailService";

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
    // Normalizar o email (converter para minúsculas)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validar o formato do email
    if (!isValidEmail(normalizedEmail)) {
      toast.error('Email inválido. Por favor, verifique o endereço de email informado.');
      return false;
    }
    
    // Buscar o usuário pelo email na tabela profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      toast.error('Erro ao verificar usuário. Tente novamente.');
      return false;
    }

    // Se encontrou o perfil, vincular ao restaurante
    if (profileData) {
      const insertData: RestaurantUserInsert = {
        restaurant_id: restaurantId,
        user_id: profileData.id,
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
    }
    
    // Se não encontrou o perfil, verificar se já existe um convite pendente
    const { data: existingInvite, error: inviteCheckError } = await supabase
      .from('restaurant_invites')
      .select('id, status')
      .eq('restaurant_id', restaurantId)
      .eq('email', normalizedEmail)
      .maybeSingle();
      
    if (inviteCheckError) {
      console.error('Erro ao verificar convites existentes:', inviteCheckError);
      toast.error('Erro ao verificar convites existentes. Tente novamente.');
      return false;
    }
    
    // Se já existe um convite pendente, informar o usuário
    if (existingInvite && existingInvite.status === 'pending') {
      toast.info('Já existe um convite pendente para este email.');
      return false;
    }
    
    // Obter o nome do restaurante para o email de convite
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', restaurantId)
      .single();
      
    if (restaurantError) {
      console.error('Erro ao buscar informações do restaurante:', restaurantError);
      toast.error('Erro ao buscar informações do restaurante. Tente novamente.');
      return false;
    }
    
    // Criar um novo convite
    const { data: newInvite, error: createInviteError } = await supabase
      .from('restaurant_invites')
      .insert({
        restaurant_id: restaurantId,
        email: normalizedEmail,
        role: role,
        status: 'pending',
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createInviteError) {
      console.error('Erro ao criar convite:', createInviteError);
      toast.error('Erro ao criar convite para o usuário.');
      return false;
    }

    // Enviar email de convite
    try {
      const emailSent = await sendRestaurantInviteEmail(
        normalizedEmail,
        restaurantData.name,
        newInvite.id,
        role
      );
      
      if (emailSent) {
        toast.success(`Convite enviado para ${normalizedEmail}. O usuário receberá instruções para se cadastrar.`);
      } else {
        // O convite foi criado, mas o email não foi enviado
        toast.warning(`Convite criado, mas houve um problema ao enviar o email. O usuário pode se cadastrar usando o email ${normalizedEmail}.`);
      }
    } catch (emailError) {
      console.error('Erro ao enviar email de convite:', emailError);
      toast.warning(`Convite criado, mas houve um problema ao enviar o email. O usuário pode se cadastrar usando o email ${normalizedEmail}.`);
    }
    
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

// Função auxiliar para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
