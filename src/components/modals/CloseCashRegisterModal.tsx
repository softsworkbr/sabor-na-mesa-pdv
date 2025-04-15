import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { closeCashRegister } from "@/utils/restaurant/cashRegisterManagement";
import { formatCurrency } from "@/utils/format";

interface CloseCashRegisterModalProps {
  showModal: boolean;
  onClose: () => void;
  onSuccess: () => void;
  registerId: string;
  expectedBalance: number;
}

const CloseCashRegisterModal: React.FC<CloseCashRegisterModalProps> = ({
  showModal,
  onClose,
  onSuccess,
  registerId,
  expectedBalance
}) => {
  const [closingBalance, setClosingBalance] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balanceDifference, setBalanceDifference] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (closingBalance && expectedBalance) {
      const currentClosingBalance = Number(closingBalance.replace(',', '.'));
      setBalanceDifference(currentClosingBalance - expectedBalance);
    } else {
      setBalanceDifference(0);
    }
  }, [closingBalance, expectedBalance]);

  const handleCloseRegister = async () => {
    if (!registerId || !closingBalance) {
      toast.error("Por favor, informe o saldo final");
      return;
    }

    try {
      setIsLoading(true);
      await closeCashRegister(registerId, {
        closing_balance: Number(closingBalance.replace(',', '.')),
        closing_notes: closingNotes,
      });
      
      toast.success("Caixa fechado com sucesso!");
      setClosingBalance('');
      setClosingNotes('');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao fechar o caixa: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters except for decimal point
    const value = e.target.value.replace(/[^\d.,]/g, '');
    // Replace comma with dot for standard decimal format
    const normalizedValue = value.replace(',', '.');
    setClosingBalance(normalizedValue);
  };

  const handleProceed = () => {
    // If there's a significant difference, show confirmation dialog
    if (Math.abs(balanceDifference) > 1) {
      setShowConfirmation(true);
    } else {
      handleCloseRegister();
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!showConfirmation ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">Fechar Caixa</h2>
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
              <div className="p-3 bg-blue-50 rounded-md mb-2">
                <p className="text-sm font-medium text-blue-800">Saldo esperado: {formatCurrency(expectedBalance)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="closingBalance">Saldo Final (R$)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">R$</span>
                  </div>
                  <Input
                    id="closingBalance"
                    type="text"
                    inputMode="decimal"
                    value={closingBalance}
                    onChange={handleBalanceChange}
                    placeholder="0,00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              {closingBalance && balanceDifference !== 0 && (
                <div className={`p-3 rounded-md ${balanceDifference > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium ${balanceDifference > 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {balanceDifference > 0 ? 'Sobra' : 'Falta'} de caixa: {formatCurrency(Math.abs(balanceDifference))}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="closingNotes">Observações</Label>
                <Input
                  id="closingNotes"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Observações sobre o fechamento do caixa"
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
                  onClick={handleProceed}
                  disabled={isLoading || !closingBalance}
                  className="sm:order-2 bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processando...
                    </>
                  ) : (
                    "Fechar Caixa"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-amber-600">Confirmar Fechamento</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={() => setShowConfirmation(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-amber-50 rounded-md border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Diferença no saldo</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Existe uma diferença de {formatCurrency(Math.abs(balanceDifference))} entre o saldo esperado e o saldo informado.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    Tem certeza que deseja fechar o caixa com esta diferença?
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmation(false)}
                  disabled={isLoading}
                  className="sm:order-1"
                >
                  Voltar e Revisar
                </Button>
                <Button 
                  onClick={handleCloseRegister}
                  disabled={isLoading}
                  className="sm:order-2 bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Processando...
                    </>
                  ) : (
                    "Confirmar Fechamento"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CloseCashRegisterModal;
