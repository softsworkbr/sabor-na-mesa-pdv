import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import { openCashRegister } from "@/utils/restaurant/cashRegisterManagement";

interface OpenCashRegisterModalProps {
  showModal: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId: string;
}

const OpenCashRegisterModal: React.FC<OpenCashRegisterModalProps> = ({
  showModal,
  onClose,
  onSuccess,
  restaurantId
}) => {
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenRegister = async () => {
    if (!restaurantId || !openingBalance) {
      toast.error("Por favor, informe o saldo inicial");
      return;
    }

    try {
      setIsLoading(true);
      await openCashRegister({
        restaurant_id: restaurantId,
        opening_balance: Number(openingBalance),
        opening_notes: openingNotes,
      });
      
      toast.success("Caixa aberto com sucesso!");
      setOpeningBalance('');
      setOpeningNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao abrir o caixa: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters except for decimal point
    const value = e.target.value.replace(/[^\d.,]/g, '');
    // Replace comma with dot for standard decimal format
    const normalizedValue = value.replace(',', '.');
    setOpeningBalance(normalizedValue);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">Abrir Caixa</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openingBalance">Saldo Inicial (R$)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">R$</span>
              </div>
              <Input
                id="openingBalance"
                type="text"
                inputMode="decimal"
                value={openingBalance}
                onChange={handleBalanceChange}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="openingNotes">Observações</Label>
            <Input
              id="openingNotes"
              value={openingNotes}
              onChange={(e) => setOpeningNotes(e.target.value)}
              placeholder="Observações sobre a abertura do caixa"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleOpenRegister}
              disabled={isLoading || !openingBalance}
              className="sm:order-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processando...
                </>
              ) : (
                "Abrir Caixa"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenCashRegisterModal;
