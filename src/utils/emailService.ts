import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Envia um email de convite para um usuário se juntar ao restaurante
 * @param email Email do destinatário
 * @param restaurantName Nome do restaurante
 * @param inviteId ID do convite
 * @param role Função do usuário no restaurante (gerente, funcionário)
 * @returns Promise que resolve para true se o email foi enviado com sucesso
 */
export const sendRestaurantInviteEmail = async (
  email: string,
  restaurantName: string,
  inviteId: string,
  role: 'manager' | 'staff'
): Promise<boolean> => {
  try {
    // URL da aplicação para o link de convite
    const appUrl = window.location.origin;
    const inviteLink = `${appUrl}/auth?invite=${inviteId}`;
    
    // Tradução da função para português
    const roleName = role === 'manager' ? 'Gerente' : 'Funcionário';
    
    // MODO DE DESENVOLVIMENTO: Simular o envio de email e mostrar informações úteis
    console.log('🔧 MODO DE DESENVOLVIMENTO: Simulando envio de email');
    console.log('📧 Email seria enviado para:', email);
    console.log('🏢 Restaurante:', restaurantName);
    console.log('🔗 Link de convite:', inviteLink);
    console.log('👤 Função:', roleName);
    
    // Mostrar toast com informações do convite
    toast.info(
      `Modo de desenvolvimento: Email simulado para ${email}. Link de convite: ${inviteLink}`,
      { duration: 10000 }
    );
    
    // Comentando o código que chama a Edge Function por enquanto
    /*
    // Chamar a Edge Function do Supabase para enviar o email
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: { 
        email, 
        restaurantName, 
        inviteId, 
        role 
      }
    });
    
    if (error) {
      console.error('Erro ao chamar a Edge Function para envio de email:', error);
      return false;
    }
    
    if (data?.success) {
      console.log('Email de convite enviado com sucesso:', data);
      return true;
    } else {
      console.error('Erro ao enviar email de convite:', data);
      return false;
    }
    */
    
    // Sempre retorna sucesso em desenvolvimento
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    
    // Mesmo com erro, retornamos true para não bloquear o fluxo em desenvolvimento
    toast.warning(
      `Erro ao enviar email, mas o convite foi criado. Email: ${email}`,
      { duration: 10000 }
    );
    
    return true;
  }
};
