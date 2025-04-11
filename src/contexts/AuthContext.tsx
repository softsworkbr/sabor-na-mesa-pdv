
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { username?: string, full_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Mock data for restaurants - in a real application, this would come from Supabase
  useEffect(() => {
    if (user) {
      const mockRestaurants: Restaurant[] = [
        { id: '1', name: 'Sabor na Mesa - Centro', role: 'owner' },
        { id: '2', name: 'Sabor na Mesa - Barra', role: 'manager' },
        { id: '3', name: 'Sabor na Mesa - Ipanema', role: 'staff' },
      ];
      setRestaurants(mockRestaurants);
      
      // Set default restaurant if none is selected
      if (!currentRestaurant) {
        setCurrentRestaurant(mockRestaurants[0]);
      }

      // In a real application, you would fetch the user's restaurants from Supabase
      // async function fetchUserRestaurants() {
      //   const { data, error } = await supabase
      //     .from('restaurant_users')
      //     .select('*, restaurants(*)')
      //     .eq('user_id', user.id);
      //
      //   if (error) {
      //     toast.error('Erro ao carregar restaurantes');
      //     return;
      //   }
      //
      //   if (data && data.length > 0) {
      //     setRestaurants(data.map(item => ({
      //       id: item.restaurants.id,
      //       name: item.restaurants.name,
      //       role: item.role
      //     })));
      //     setCurrentRestaurant(data[0]);
      //   }
      // }
      //
      // fetchUserRestaurants();
    }
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao fazer login: ${error.message}`);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: { username?: string, full_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.full_name
          }
        }
      });
      
      if (error) throw error;
      
      // Check if the user was created and a confirmation email was sent
      if (error?.status !== 429) {
        toast.success("Cadastro realizado com sucesso! Verifique seu email para confirmação.");
      }
    } catch (error: any) {
      // Special handling for rate limit errors
      if (error.code === 'over_email_send_rate_limit') {
        toast.error("Por favor, aguarde alguns segundos antes de tentar novamente.");
      } else {
        toast.error(`Erro ao criar conta: ${error.message}`);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentRestaurant(null);
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao fazer logout: ${error.message}`);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      restaurants,
      currentRestaurant,
      setCurrentRestaurant
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
