
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createRestaurant } from "@/utils/restaurant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RestaurantList = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantAddress, setNewRestaurantAddress] = useState("");
  const [newRestaurantPhone, setNewRestaurantPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        // Recarregar a página para atualizar a lista de restaurantes
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao criar restaurante:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seus Restaurantes</h2>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-pos-primary hover:bg-pos-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Restaurante
        </Button>
      </div>

      {/* Dialog para criar novo restaurante */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Restaurante</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRestaurant}>
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
                {isLoading ? "Criando..." : "Criar Restaurante"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantList;
