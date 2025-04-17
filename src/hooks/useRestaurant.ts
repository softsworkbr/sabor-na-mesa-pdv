import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  // Adicione outros campos conforme necessário
}

export const useRestaurant = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        
        // Obter o primeiro restaurante (assumindo que o usuário atual só tem acesso a um restaurante)
        // Em um sistema multi-restaurante, você pode querer ajustar essa lógica
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .limit(1)
          .single();
        
        if (error) throw error;
        
        setRestaurant(data);
      } catch (err) {
        console.error('Erro ao obter restaurante:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, []);

  return { restaurant, loading, error };
};

export default useRestaurant;
