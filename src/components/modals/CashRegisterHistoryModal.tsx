import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Calendar, Clock, User, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from 'date-fns';
import { 
  getClosedCashRegisters, 
  getCashRegisterById 
} from '@/utils/restaurant/cashRegisterManagement';
import { CashRegister } from '@/utils/restaurant/cashRegisterTypes';
import { formatCurrency } from '@/utils/format';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CashRegisterHistoryModalProps {
  showModal: boolean;
  onClose: () => void;
  onSelectRegister: (registerId: string) => void;
  restaurantId: string;
}

const CashRegisterHistoryModal: React.FC<CashRegisterHistoryModalProps> = ({
  showModal,
  onClose,
  onSelectRegister,
  restaurantId
}) => {
  const [closedRegisters, setClosedRegisters] = useState<CashRegister[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showModal && restaurantId) {
      fetchClosedRegisters();
    }
  }, [showModal, restaurantId]);

  const fetchClosedRegisters = async () => {
    setIsLoading(true);
    try {
      const registers = await getClosedCashRegisters(restaurantId, 20);
      setClosedRegisters(registers);
    } catch (error: any) {
      toast.error(`Erro ao buscar caixas fechados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">Histórico de Caixas</h2>
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : closedRegisters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum caixa fechado encontrado.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {closedRegisters.map((register) => (
                  <div 
                    key={register.id} 
                    className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onSelectRegister(register.id || '')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">Caixa #{register.id?.substring(0, 6)}</h3>
                      <span className="text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        Fechado
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Aberto: {format(new Date(register.opened_at || ''), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Fechado: {register.closed_at ? format(new Date(register.closed_at), 'dd/MM/yyyy HH:mm') : '-'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Saldo inicial: {formatCurrency(register.opening_balance)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Saldo final: {register.closing_balance ? formatCurrency(register.closing_balance) : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashRegisterHistoryModal;
