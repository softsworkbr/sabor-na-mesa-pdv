import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addUserToRestaurant } from '@/utils/restaurant/userManagement';

// Esquemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Interfaces para tipagem
interface RestaurantInvite {
  id: string;
  restaurant_id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Restaurant {
  id: string;
  name: string;
  created_at: string;
}

interface InviteInfo {
  id: string;
  email: string;
  restaurantId: string;
  restaurantName: string;
  role: string;
}

const AuthPage: React.FC = () => {
  const { signIn, signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("login");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Extrair o ID do convite da URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const inviteId = queryParams.get('invite');

    console.log('Parâmetros da URL:', location.search);
    console.log('ID do convite extraído da URL:', inviteId);

    if (inviteId) {
      // Remover possíveis espaços em branco ou caracteres inválidos
      const cleanInviteId = inviteId.trim();
      console.log('ID do convite limpo:', cleanInviteId);
      fetchInviteInfo(cleanInviteId);
    }
  }, [location]);

  // Buscar informações do convite
  const fetchInviteInfo = async (inviteId: string) => {
    setLoadingInvite(true);
    try {
      console.log('Buscando convite com ID:', inviteId);

      // Verificar se existem convites na tabela (consulta geral)
      const { data: allInvites, error: allInvitesError } = await supabase
        .from('restaurant_invites')
        .select('id, email, status')
        .limit(5);

      console.log('Amostra de convites na tabela:', allInvites);
      console.log('Erro na consulta geral:', allInvitesError);

      // Verificar se o ID está no formato correto
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUUID = uuidRegex.test(inviteId);
      console.log('O ID do convite é um UUID válido?', isValidUUID);

      // Buscar convite sem filtro de status
      const { data: inviteNoStatus, error: noStatusError } = await supabase
        .from('restaurant_invites')
        .select('*')
        .eq('id', inviteId);

      console.log('Busca sem filtro de status:', { inviteNoStatus, error: noStatusError });

      // Busca com like para verificar se há problemas com o formato exato
      const { data: invitesLike, error: likeError } = await supabase
        .from('restaurant_invites')
        .select('*')
        .like('id', `%${inviteId.substring(0, 8)}%`);

      console.log('Busca com LIKE parcial:', { invitesLike, error: likeError });

      // Primeiro verificamos se o convite existe sem usar .single()
      const { data: invites, error: inviteQueryError } = await supabase
        .from('restaurant_invites')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending');

      console.log('Resultado da busca de convites:', { invites, error: inviteQueryError });

      if (inviteQueryError) {
        console.error('Erro ao buscar convite:', inviteQueryError);
        toast.error('Erro ao buscar convite.');
        return;
      }

      // Verificar se encontrou algum convite
      if (!invites || invites.length === 0) {
        console.error('Convite não encontrado ou já utilizado');

        // Verificar se existe o convite com qualquer status
        const { data: anyInvites } = await supabase
          .from('restaurant_invites')
          .select('id, status, email')
          .eq('id', inviteId);

        console.log('Verificação de convite com qualquer status:', anyInvites);

        if (anyInvites && anyInvites.length > 0) {
          const invite = anyInvites[0];
          if (invite.status !== 'pending') {
            toast.error(`Convite já ${invite.status === 'accepted' ? 'aceito' : 'expirado'}.`);
          } else {
            toast.error('Convite inválido ou expirado.');
          }
        } else {
          // Se não encontrou nada, verificar se há convites com o ID parcial
          if (invitesLike && invitesLike.length > 0) {
            console.log('Encontrou convites com ID parcial:', invitesLike);
            toast.error('Convite encontrado com ID parcial, mas não exato. Verifique o link.');
          } else if (allInvites && allInvites.length > 0) {
            toast.error('Convite não encontrado. Verifique o link e tente novamente.');
          } else {
            toast.error('Não há convites no sistema. Verifique se a tabela foi criada corretamente.');
          }
        }
        return;
      }

      // Usar o primeiro convite encontrado
      const typedInvite = invites[0] as RestaurantInvite;
      console.log('Convite encontrado:', typedInvite);

      // Buscar informações do restaurante
      const { data: restaurants, error: restaurantQueryError } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', typedInvite.restaurant_id);

      console.log('Resultado da busca de restaurante:', { restaurants, error: restaurantQueryError });

      if (restaurantQueryError) {
        console.error('Erro ao buscar restaurante:', restaurantQueryError);
        toast.error('Erro ao buscar informações do restaurante.');
        return;
      }

      // Verificar se encontrou o restaurante
      if (!restaurants || restaurants.length === 0) {
        console.error('Restaurante não encontrado');
        toast.error('Restaurante não encontrado.');
        return;
      }

      const typedRestaurant = restaurants[0] as Restaurant;

      // Definir as informações do convite
      setInviteInfo({
        id: typedInvite.id,
        email: typedInvite.email,
        restaurantId: typedInvite.restaurant_id,
        restaurantName: typedRestaurant.name,
        role: typedInvite.role
      });

      // Preencher o campo de email no formulário
      if (typedInvite.email) {
        loginForm.setValue('email', typedInvite.email);
        registerForm.setValue('email', typedInvite.email);
      }

      // Mostrar alerta sobre o convite
      toast.info(`Você foi convidado para se juntar ao restaurante ${typedRestaurant.name} como ${typedInvite.role === 'manager' ? 'gerente' : 'atendente'}.`);

    } catch (error) {
      console.error('Erro ao processar convite:', error);
      toast.error('Ocorreu um erro ao processar o convite.');
    } finally {
      setLoadingInvite(false);
    }
  };

  // Aceitar o convite após o registro bem-sucedido
  const acceptInvite = async () => {
    if (!inviteInfo || !user) {
      console.log('Não foi possível aceitar o convite: inviteInfo ou user não definidos', { inviteInfo, user });
      return;
    }

    try {
      console.log('Iniciando aceitação de convite para usuário:', user.id);
      console.log('Informações do convite:', inviteInfo);

      const { data: inviteData, error: inviteDataError } = await supabase
        .from('restaurant_invites')
        .select('restaurant_id, role')
        .eq('id', inviteInfo.id)
        .single();

      console.log('Dados do convite recuperados:', { inviteData, error: inviteDataError });

      if (inviteDataError || !inviteData) {
        console.error('Erro ao buscar dados do convite:', inviteDataError);
        toast.error('Erro ao aceitar o convite.');
        return;
      }

      const typedInviteData = inviteData as Pick<RestaurantInvite, 'restaurant_id' | 'role'>;
      console.log('Dados tipados do convite:', typedInviteData);

      // Verificar se o usuário já está vinculado ao restaurante
      const { data: existingUser, error: existingUserError } = await supabase
        .from('restaurant_users')
        .select('*')
        .eq('restaurant_id', typedInviteData.restaurant_id)
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Verificação de usuário existente:', { existingUser, error: existingUserError });

      if (existingUser) {
        console.log('Usuário já vinculado ao restaurante');
        toast.info('Você já está vinculado a este restaurante.');
      } else {
        // Inserir diretamente na tabela restaurant_users
        const insertData = {
          restaurant_id: typedInviteData.restaurant_id,
          user_id: user.id,
          role: typedInviteData.role
        };

        console.log('Tentando inserir usuário no restaurante:', insertData);

        const { error: insertError } = await supabase
          .from('restaurant_users')
          .insert(insertData);

        console.log('Resultado da inserção:', { error: insertError });

        if (insertError) {
          // Verificar erro de chave duplicada
          if (insertError.code === '23505') {
            console.log('Erro de duplicação ao inserir usuário');
            toast.info('Você já está vinculado a este restaurante.');
          } else {
            console.error('Erro ao vincular usuário ao restaurante:', insertError);
            toast.error('Erro ao vincular você ao restaurante.');
            return;
          }
        } else {
          console.log('Usuário vinculado com sucesso ao restaurante');
        }
      }

      // Atualizar status do convite para aceito
      console.log('Atualizando status do convite para aceito');
      const { error: updateError } = await supabase
        .from('restaurant_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteInfo.id);

      console.log('Resultado da atualização do convite:', { error: updateError });

      if (updateError) {
        console.error('Erro ao atualizar status do convite:', updateError);
        toast.error('Erro ao finalizar o processo de convite.');
        return;
      }

      toast.success(`Você foi adicionado ao restaurante ${inviteInfo.restaurantName} com sucesso!`);
      navigate('/dashboard');

    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast.error('Ocorreu um erro ao aceitar o convite.');
    }
  };

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Efeito para o cooldown
  useEffect(() => {
    let timer: number | null = null;

    if (cooldownActive && cooldownTime > 0) {
      timer = window.setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownActive, cooldownTime]);

  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: inviteInfo?.email || '',
      password: '',
    },
  });

  // Formulário de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: inviteInfo?.email || '',
      username: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Função de login
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);

      // Se houver um convite, aceitar automaticamente após o login
      if (inviteInfo && user) {
        await acceptInvite();
      }

      navigate('/');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    if (cooldownActive) return;

    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName
          }
        }
      });

      if (error) throw error;

      // Se houver um convite e o registro for bem-sucedido, aceitar o convite
      if (inviteInfo && authData.user) {
        await acceptInvite();
        toast.success(`Conta criada e vinculada ao restaurante ${inviteInfo.restaurantName} como ${inviteInfo.role}!`);
      } else {
        toast.success("Cadastro realizado com sucesso! Verifique seu email para confirmação.");
      }
    } catch (error: any) {
      console.error(error);
      // Verificar se é um erro de rate limiting
      if (error.code === 'over_email_send_rate_limit') {
        // Extrair o número de segundos do erro, ou usar um valor padrão
        const waitTimeMatch = error.message.match(/after (\d+) seconds/);
        const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 30;

        setCooldownTime(waitTime);
        setCooldownActive(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Sabor na Mesa</h1>
          <p className="text-gray-600">Sistema de Gestão para Restaurantes</p>
        </div>

        {inviteInfo && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800">Convite para Restaurante</AlertTitle>
            <AlertDescription className="text-blue-700">
              Você foi convidado para se juntar ao restaurante <strong>{inviteInfo.restaurantName}</strong> como <strong>{inviteInfo.role}</strong>.
              {activeTab === 'register' ?
                ' Complete seu cadastro para aceitar o convite.' :
                ' Faça login com sua conta existente para aceitar o convite.'}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@exemplo.com"
                              {...field}
                              disabled={!!inviteInfo}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta</CardTitle>
                <CardDescription>Registre-se para começar a usar o sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@exemplo.com"
                              {...field}
                              disabled={!!inviteInfo}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de Usuário</FormLabel>
                          <FormControl>
                            <Input placeholder="seuusuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu Nome Completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || cooldownActive}
                    >
                      {isLoading ? 'Registrando...' :
                        cooldownActive ? `Aguarde ${cooldownTime}s...` : 'Registrar'}
                    </Button>
                    {cooldownActive && (
                      <p className="text-amber-600 text-sm text-center mt-2">
                        Por razões de segurança, aguarde {cooldownTime} segundos antes de tentar novamente.
                      </p>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
