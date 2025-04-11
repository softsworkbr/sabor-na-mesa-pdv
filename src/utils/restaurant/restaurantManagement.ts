
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateRestaurantProps } from "./types";
import { createTable } from "./tableManagement";
import { TableStatus } from "./tableTypes";

export const createRestaurant = async (data: CreateRestaurantProps) => {
  try {
    // First create the restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        logo_url: data.logo_url || null,
      })
      .select()
      .single();

    if (restaurantError) {
      throw restaurantError;
    }

    // Then add the current user as an owner of the restaurant
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const { error: userError } = await supabase
      .from('restaurant_users')
      .insert({
        restaurant_id: restaurant.id,
        user_id: userId,
        role: 'owner'
      });

    if (userError) {
      // If there's an error, try to rollback by deleting the restaurant
      await supabase.from('restaurants').delete().eq('id', restaurant.id);
      throw userError;
    }

    // Add 30 default tables to the restaurant
    await createDefaultTables(restaurant.id);

    toast.success('Restaurante criado com sucesso!');
    return restaurant;
  } catch (error: any) {
    toast.error(`Erro ao criar restaurante: ${error.message}`);
    throw error;
  }
};

// Function to create 30 default tables for a new restaurant
const createDefaultTables = async (restaurantId: string) => {
  try {
    // Create tables in batches to avoid overwhelming the database
    const promises = [];
    
    for (let i = 1; i <= 30; i++) {
      promises.push(
        createTable({
          number: i,
          status: "free" as TableStatus,
          restaurant_id: restaurantId,
          description: `Mesa ${i}`
        })
      );
    }

    await Promise.all(promises);
    toast.success("30 mesas padrão foram criadas com sucesso!");
  } catch (error: any) {
    console.error("Error creating default tables:", error);
    toast.error("As mesas foram criadas parcialmente ou não foram criadas.");
    // We don't throw here to avoid rolling back the restaurant creation
    // The user can add tables manually if this fails
  }
};

export const updateRestaurant = async (
  restaurantId: string,
  data: Partial<CreateRestaurantProps>
) => {
  try {
    const { data: updatedRestaurant, error } = await supabase
      .from('restaurants')
      .update(data)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      toast.error(`Erro ao atualizar restaurante: ${error.message}`);
      throw error;
    }

    toast.success('Restaurante atualizado com sucesso!');
    return updatedRestaurant;
  } catch (error) {
    console.error('Error updating restaurant:', error);
    throw error; // Modificado para propagar o erro para quem chamou a função
  }
};
