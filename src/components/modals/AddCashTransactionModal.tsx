import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, PlusCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { createCashRegisterTransaction } from "@/utils/restaurant/cashRegisterManagement";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddCashTransactionModalProps {
  showModal: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registerId: string;
}

const AddCashTransactionModal: React.FC<AddCashTransactionModalProps> = ({
  showModal,
  onClose,
  onSuccess,
  registerId
}) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTransaction = async () => {
    if (!registerId || !amount) {
      toast.error("Por favor, informe o valor da transação");
      return;
    }

    try {
      setIsLoading(true);
      await createCashRegisterTransaction({
        cash_register_id: registerId,
        amount: Number(amount.replace(',', '.')),
        type,
        notes,
      });
      
      toast.success(`${type === 'deposit' ? 'Depósito' : 'Retirada'} registrado com sucesso!`);
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao registrar transação: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters except for decimal point
    const value = e.target.value.replace(/[^\d.,]/g, '');
    // Replace comma with dot for standard decimal format
    const normalizedValue = value.replace(',', '.');
    setAmount(normalizedValue);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">
            {type === 'deposit' ? 'Adicionar Depósito' : 'Registrar Retirada'}
          </h2>
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
            <Label>Tipo de Transação</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(value) => setType(value as 'deposit' | 'withdrawal')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deposit" id="deposit" />
                <Label htmlFor="deposit" className="flex items-center cursor-pointer">
                  <PlusCircle className="h-4 w-4 mr-2 text-green-600" />
                  Depósito
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="withdrawal" id="withdrawal" />
                <Label htmlFor="withdrawal" className="flex items-center cursor-pointer">
                  <MinusCircle className="h-4 w-4 mr-2 text-red-600" />
                  Retirada
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">R$</span>
              </div>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Motivo / Observações</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={type === 'deposit' ? "Motivo do depósito" : "Motivo da retirada"}
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
              onClick={handleAddTransaction}
              disabled={isLoading || !amount}
              className={`sm:order-2 ${type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processando...
                </>
              ) : (
                type === 'deposit' ? 'Adicionar Depósito' : 'Registrar Retirada'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCashTransactionModal;
