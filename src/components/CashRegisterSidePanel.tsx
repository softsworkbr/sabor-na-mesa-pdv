
import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { CashRegister } from '@/utils/restaurant/cashRegisterTypes';

interface CashRegisterSidePanelProps {
  register: CashRegister;
  currentUser: any;
}

export const CashRegisterSidePanel = ({ register, currentUser }: CashRegisterSidePanelProps) => {
  return (
    <div className="w-80 bg-gray-800 text-white p-4 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">
          Caixa {register.status === 'open' ? 'Aberto' : 'Fechado'}
        </h2>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400">Saldo inicial (dinheiro):</label>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
              .format(register.opening_balance)}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400">Observação:</label>
          <div className="bg-gray-700 p-3 rounded-md min-h-[100px]">
            {register.opening_notes || `Aberto às ${format(new Date(register.opened_at || ''), 'HH:mm')} por ${currentUser?.name}`}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400">Data / Hora de abertura:</label>
          <div className="text-lg">
            {format(new Date(register.opened_at || ''), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};
