// Supabase Edge Function para enviar emails de convite para restaurantes
// @ts-ignore - Importações do Deno são resolvidas em tempo de execução
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Configurações de CORS diretamente no arquivo
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, user-agent, referer',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    // Extrair dados da requisição
    const { email, restaurantName, inviteId, role } = await req.json()

    // Validar dados de entrada
    if (!email || !restaurantName || !inviteId || !role) {
      throw new Error('Dados incompletos. Todos os campos são obrigatórios.')
    }

    // Obter a URL base da aplicação
    // @ts-ignore - Objeto Deno disponível apenas no ambiente de execução do Supabase
    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:8080'
    
    // Construir o link de convite
    const inviteLink = `${appUrl}/auth?invite=${inviteId}`
    
    // Determinar o nome da função em português
    const roleName = role === 'manager' ? 'Gerente' : 'Funcionário'

    // Registrar informações no console para depuração
    console.log('Enviando convite para:', email);
    console.log('Restaurante:', restaurantName);
    console.log('Link de convite:', inviteLink);
    console.log('Função:', roleName);
    
    // Versão simplificada - apenas retorna sucesso
    // Em produção, você deve implementar o envio real de email
    
    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: `Simulação de envio de convite para ${email}. Em produção, o email seria enviado.`,
        debug: {
          email,
          restaurantName,
          inviteLink,
          roleName
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    
    // Retornar resposta de erro
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
