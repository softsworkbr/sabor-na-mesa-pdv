
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { createRestaurant, updateRestaurant } from "@/utils/restaurant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  created_at: string;
}

const RestaurantList = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantAddress, setNewRestaurantAddress] = useState("");
  const [newRestaurantPhone, setNewRestaurantPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);

  // Buscar restaurantes do usuário
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user) return;

      try {
        setIsLoadingRestaurants(true);
        const { data: userRestaurants, error } = await supabase
          .from("restaurant_users")
          .select("restaurant_id")
          .eq("user_id", user.id);

        if (error) throw error;

        if (userRestaurants.length > 0) {
          const restaurantIds = userRestaurants.map(ur => ur.restaurant_id);
          
          const { data, error: restaurantsError } = await supabase
            .from("restaurants")
            .select("*")
            .in("id", restaurantIds)
            .order("name");

          if (restaurantsError) throw restaurantsError;
          
          setRestaurants(data || []);
          setFilteredRestaurants(data || []);
        } else {
          setRestaurants([]);
          setFilteredRestaurants([]);
        }
      } catch (error) {
        console.error("Erro ao buscar restaurantes:", error);
        toast.error("Não foi possível carregar seus restaurantes");
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [user]);

  // Filtrar restaurantes quando a busca mudar
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchQuery, restaurants]);

  const resetForm = () => {
    setNewRestaurantName("");
    setNewRestaurantAddress("");
    setNewRestaurantPhone("");
    setIsEditMode(false);
    setCurrentRestaurantId(null);
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRestaurantName.trim()) {
      toast.error("O nome do restaurante é obrigatório");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const restaurant = await createRestaurant({
        name: newRestaurantName,
        address: newRestaurantAddress,
        phone: newRestaurantPhone
      });
      
      if (restaurant) {
        toast.success("Restaurante criado com sucesso!");
        setIsOpen(false);
        // Atualizar lista de restaurantes
        setRestaurants(prev => [...prev, restaurant]);
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao criar restaurante:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRestaurantName.trim() || !currentRestaurantId) {
      toast.error("O nome do restaurante é obrigatório");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await updateRestaurant(currentRestaurantId, {
        name: newRestaurantName,
        address: newRestaurantAddress,
        phone: newRestaurantPhone
      });
      
      if (success) {
        // Atualizar restaurante na lista local
        setRestaurants(prev => 
          prev.map(restaurant => 
            restaurant.id === currentRestaurantId 
              ? { 
                  ...restaurant, 
                  name: newRestaurantName,
                  address: newRestaurantAddress,
                  phone: newRestaurantPhone
                } 
              : restaurant
          )
        );
        
        setIsOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Erro ao atualizar restaurante:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (restaurant: Restaurant) => {
    setCurrentRestaurantId(restaurant.id);
    setNewRestaurantName(restaurant.name);
    setNewRestaurantAddress(restaurant.address || "");
    setNewRestaurantPhone(restaurant.phone || "");
    setIsEditMode(true);
    setIsOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seus Restaurantes</h2>
        <Button 
          onClick={openCreateDialog}
          className="bg-pos-primary hover:bg-pos-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Restaurante
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar restaurantes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Lista de restaurantes */}
      {isLoadingRestaurants ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{restaurant.name}</h3>
                    {restaurant.address && (
                      <p className="text-muted-foreground text-sm mt-1">{restaurant.address}</p>
                    )}
                    {restaurant.phone && (
                      <p className="text-muted-foreground text-sm">{restaurant.phone}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(restaurant)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery.trim() !== "" 
                ? "Nenhum restaurante encontrado com esse nome."
                : "Você ainda não tem restaurantes. Crie um novo restaurante para começar."}
            </p>
          </CardContent>
          {searchQuery.trim() !== "" && (
            <CardFooter className="flex justify-center pb-6">
              <Button variant="outline" onClick={() => setSearchQuery("")}>Limpar busca</Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Dialog para criar/editar restaurante */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Restaurante" : "Criar Novo Restaurante"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditMode ? handleEditRestaurant : handleCreateRestaurant}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Restaurante *</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome do restaurante"
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Digite o endereço"
                  value={newRestaurantAddress}
                  onChange={(e) => setNewRestaurantAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="Digite o telefone"
                  value={newRestaurantPhone}
                  onChange={(e) => setNewRestaurantPhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-pos-primary hover:bg-pos-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : isEditMode ? "Salvar Alterações" : "Criar Restaurante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantList;
