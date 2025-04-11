import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { username?: string, full_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      toast.success("Cadastro realizado com sucesso! Verifique seu email para confirmação.");
    } catch (error: any) {
      toast.error(`Erro ao criar conta: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao fazer logout: ${error.message}`);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
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
