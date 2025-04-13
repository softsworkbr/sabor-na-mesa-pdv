
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  address?: string | null;
  phone?: string | null;
  logo_url?: string | null;
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
  refreshRestaurants: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Local storage key for saving the last used restaurant
const LAST_RESTAURANT_KEY = 'lastUsedRestaurant';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // Function to save the current restaurant to localStorage
  const saveCurrentRestaurantToStorage = (restaurant: Restaurant | null) => {
    if (restaurant) {
      localStorage.setItem(LAST_RESTAURANT_KEY, JSON.stringify(restaurant));
    }
  };

  // Custom setter for currentRestaurant that also saves to localStorage
  const handleSetCurrentRestaurant = (restaurant: Restaurant | null) => {
    setCurrentRestaurant(restaurant);
    saveCurrentRestaurantToStorage(restaurant);
  };

  // Função para buscar restaurantes do usuário
  const fetchUserRestaurants = async () => {
    if (!user) return;

    try {
      // Query to get all restaurants that the user has access to along with their role
      const { data: restaurantUsers, error } = await supabase
        .from('restaurant_users')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching restaurant users:', error);
        toast.error('Erro ao carregar restaurantes');
        return;
      }

      if (restaurantUsers && restaurantUsers.length > 0) {
        // Get all restaurant IDs
        const restaurantIds = restaurantUsers.map(ru => ru.restaurant_id);

        // Fetch restaurant details
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .in('id', restaurantIds);

        if (restaurantError) {
          console.error('Error fetching restaurants:', restaurantError);
          toast.error('Erro ao carregar detalhes dos restaurantes');
          return;
        }

        // Combine restaurant details with roles
        const userRestaurants: Restaurant[] = restaurantData.map(restaurant => {
          const userRestaurant = restaurantUsers.find(
            ru => ru.restaurant_id === restaurant.id
          );
          return {
            id: restaurant.id,
            name: restaurant.name,
            role: userRestaurant?.role as 'owner' | 'manager' | 'staff',
            address: restaurant.address,
            phone: restaurant.phone,
            logo_url: restaurant.logo_url
          };
        });

        setRestaurants(userRestaurants);
        
        // Try to get the last used restaurant from localStorage
        try {
          const lastUsedRestaurantString = localStorage.getItem(LAST_RESTAURANT_KEY);
          if (lastUsedRestaurantString) {
            const lastUsedRestaurant = JSON.parse(lastUsedRestaurantString);
            
            // Check if the last used restaurant is still in the user's list
            const restaurantStillExists = userRestaurants.find(r => r.id === lastUsedRestaurant.id);
            
            if (restaurantStillExists) {
              // Use the updated restaurant data
              handleSetCurrentRestaurant(restaurantStillExists);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing last used restaurant:', e);
          // Continue with normal flow if there's an error with localStorage
        }
        
        // Atualizar restaurante atual apenas se ele não existir mais na lista
        if (currentRestaurant) {
          const stillExists = userRestaurants.find(r => r.id === currentRestaurant.id);
          if (!stillExists && userRestaurants.length > 0) {
            handleSetCurrentRestaurant(userRestaurants[0]);
          } else if (stillExists) {
            // Atualiza o restaurante atual com os dados mais recentes
            const updatedCurrentRestaurant = userRestaurants.find(r => r.id === currentRestaurant.id);
            if (updatedCurrentRestaurant) {
              handleSetCurrentRestaurant(updatedCurrentRestaurant);
            }
          }
        } 
        // Set default restaurant if none is selected
        else if (userRestaurants.length > 0) {
          handleSetCurrentRestaurant(userRestaurants[0]);
        }
      } else {
        // For demo purposes, use the mock data when the user has no restaurants
        console.log("No restaurants found in database for this user, using sample data");
        const mockRestaurants: Restaurant[] = [
          { id: '1', name: 'Sabor na Mesa - Centro', role: 'owner' },
          { id: '2', name: 'Sabor na Mesa - Barra', role: 'manager' },
          { id: '3', name: 'Sabor na Mesa - Ipanema', role: 'staff' },
        ];
        setRestaurants(mockRestaurants);
        
        if (!currentRestaurant) {
          // Try to get the last used restaurant from localStorage
          try {
            const lastUsedRestaurantString = localStorage.getItem(LAST_RESTAURANT_KEY);
            if (lastUsedRestaurantString) {
              const lastUsedRestaurant = JSON.parse(lastUsedRestaurantString);
              // Check if the mocked restaurant with this ID exists
              const mockedRestaurant = mockRestaurants.find(r => r.id === lastUsedRestaurant.id);
              
              if (mockedRestaurant) {
                handleSetCurrentRestaurant(mockedRestaurant);
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing last used restaurant:', e);
          }
          
          // Default to first restaurant if no last used restaurant exists
          handleSetCurrentRestaurant(mockRestaurants[0]);
        }
      }
    } catch (err) {
      console.error('Error in fetchUserRestaurants:', err);
      toast.error('Erro ao carregar dados dos restaurantes');
    }
  };

  // Função exposta para recarregar restaurantes
  const refreshRestaurants = async () => {
    await fetchUserRestaurants();
  };

  // Fetch user's restaurants from Supabase
  useEffect(() => {
    fetchUserRestaurants();
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
      handleSetCurrentRestaurant(null);
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
      setCurrentRestaurant: handleSetCurrentRestaurant,
      refreshRestaurants
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
