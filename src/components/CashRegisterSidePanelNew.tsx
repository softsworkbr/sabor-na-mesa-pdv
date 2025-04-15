import React from 'react';
import { format } from 'date-fns';
import { CashRegister } from '@/utils/restaurant/cashRegisterTypes';

interface CashRegisterSidePanelProps {
  register: CashRegister;
  currentUser: {
    id?: string;
    email?: string;
    name?: string;
    username?: string;
  } | null;
}

export const CashRegisterSidePanelNew = ({ register, currentUser }: CashRegisterSidePanelProps) => {
  return (
    <div className="w-80 bg-gray-800 text-white h-full flex flex-col shadow-lg">
      {/* Header with status */}
      <div className={`p-4 ${register.status === 'open' ? 'bg-green-500' : 'bg-red-500'} text-white text-center`}>
        <h2 className="text-xl font-bold">
          Caixa {register.status === 'open' ? 'Aberto' : 'Fechado'}
        </h2>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        {/* Initial balance */}
        <div className="bg-gray-700 p-4 rounded-md mb-4">
          <label className="block text-sm text-gray-400 mb-1">Saldo inicial (dinheiro):</label>
          <div className="text-2xl font-bold text-center">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
              .format(register.opening_balance)}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Observação:</label>
          <div className="bg-gray-700 p-3 rounded-md min-h-[100px] text-sm">
            {register.opening_notes || `Aberto às ${format(new Date(register.opened_at || ''), 'HH:mm')} por ${currentUser?.name || 'Usuário'}`}
          </div>
        </div>

        {/* Opening date/time */}
        <div className="mt-auto">
          <label className="block text-sm text-gray-400 mb-1">Data / Hora de abertura:</label>
          <div className="text-lg">
            {format(new Date(register.opened_at || ''), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
};
