import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';
import { RestaurantInvite, Restaurant } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Esquemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Definir interface para o convite do restaurante
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

    if (inviteId) {
      fetchInviteInfo(inviteId);
    }
  }, [location]);

  // Buscar informações do convite
  const fetchInviteInfo = async (inviteId: string) => {
    setLoadingInvite(true);
    try {
      // Usar any para contornar o problema de tipagem
      const { data: invite, error: inviteError } = await (supabase
        .from('restaurant_invites') as any)
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        console.error('Erro ao buscar convite:', inviteError);
        toast.error('Convite inválido ou expirado.');
        return;
      }

      // Converter para unknown primeiro e depois para o tipo desejado
      const typedInvite = (invite as unknown) as RestaurantInvite;

      // Buscar informações do restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', typedInvite.restaurant_id)
        .single();

      if (restaurantError || !restaurant) {
        console.error('Erro ao buscar restaurante:', restaurantError);
        toast.error('Erro ao buscar informações do restaurante.');
        return;
      }

      const typedRestaurant = (restaurant as unknown) as Restaurant;

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
    if (!inviteInfo || !user) return;

    try {
      // Buscar dados do convite usando any para contornar problemas de tipagem
      const { data: inviteData, error: inviteDataError } = await (supabase
        .from('restaurant_invites') as any)
        .select('restaurant_id, role')
        .eq('id', inviteInfo.id)
        .single();

      if (inviteDataError || !inviteData) {
        console.error('Erro ao buscar dados do convite:', inviteDataError);
        toast.error('Erro ao aceitar o convite.');
        return;
      }

      // Converter para unknown primeiro e depois para o tipo desejado
      const typedInviteData = (inviteData as unknown) as Pick<RestaurantInvite, 'restaurant_id' | 'role'>;

      // Adicionar usuário ao restaurante
      const added = await addUserToRestaurant(
        typedInviteData.restaurant_id,
        user.id,
        typedInviteData.role as 'manager' | 'staff'
      );

      if (!added) {
        toast.error('Erro ao adicionar você ao restaurante.');
        return;
      }

      // Atualizar status do convite para aceito
      const { error: updateError } = await (supabase
        .from('restaurant_invites') as any)
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', inviteInfo.id);

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
