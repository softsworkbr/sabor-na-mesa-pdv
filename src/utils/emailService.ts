import emailjs from '@emailjs/browser';

// Constantes para EmailJS
const EMAILJS_SERVICE_ID = 'service_sabor_na_mesa'; // Substitua pelo seu Service ID do EmailJS
const EMAILJS_TEMPLATE_ID_INVITE = 'template_restaurant_invite'; // Substitua pelo seu Template ID do EmailJS
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY'; // Substitua pela sua Public Key do EmailJS

// Inicializar EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

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
    
    // Enviar email usando EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID_INVITE,
      {
        to_email: email,
        restaurant_name: restaurantName,
        invite_link: inviteLink,
        role_name: roleName,
        invite_id: inviteId
      }
    );
    
    if (response.status === 200) {
      console.log('Email de convite enviado com sucesso:', response);
      return true;
    } else {
      console.error('Erro ao enviar email de convite:', response);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error);
    return false;
  }
};
