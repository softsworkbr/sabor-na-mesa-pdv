
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentCashRegister, 
  getCashRegisterTransactions
} from '@/utils/restaurant/cashRegisterManagement';
import { CashRegisterTransactions } from '@/components/CashRegisterTransactions';
import { CashRegisterSidePanel } from '@/components/CashRegisterSidePanel';
import { LockOpen, Lock, Plus, Printer, Trash } from 'lucide-react';
import OpenCashRegisterModal from '@/components/modals/OpenCashRegisterModal';
import CloseCashRegisterModal from '@/components/modals/CloseCashRegisterModal';
import AddCashTransactionModal from '@/components/modals/AddCashTransactionModal';

const CashRegisterPage = () => {
  const { currentRestaurant, currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

  const { data: currentRegister, refetch: refetchRegister, isLoading: isLoadingRegister } = useQuery({
    queryKey: ['currentRegister', currentRestaurant?.id],
    queryFn: () => getCurrentCashRegister(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  const { data: transactions, refetch: refetchTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['registerTransactions', currentRegister?.id],
    queryFn: () => getCashRegisterTransactions(currentRegister?.id || ''),
    enabled: !!currentRegister?.id,
  });

  const handleRefreshData = () => {
    refetchRegister();
    refetchTransactions();
  };

  const calculateExpectedBalance = () => {
    if (!currentRegister || !transactions) return currentRegister?.opening_balance || 0;
    
    const transactionsTotal = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'payment' || transaction.type === 'deposit') {
        return acc + transaction.amount;
      } else if (transaction.type === 'withdrawal') {
        return acc - transaction.amount;
      }
      return acc;
    }, currentRegister.opening_balance);

    return transactionsTotal;
  };

  const getTransactionStats = () => {
    if (!transactions) return { payments: 0, deposits: 0, withdrawals: 0 };
    
    return transactions.reduce((stats, transaction) => {
      if (transaction.type === 'payment') {
        stats.payments += 1;
      } else if (transaction.type === 'deposit') {
        stats.deposits += 1;
      } else if (transaction.type === 'withdrawal') {
        stats.withdrawals += 1;
      }
      return stats;
    }, { payments: 0, deposits: 0, withdrawals: 0 });
  };

  const stats = getTransactionStats();

  if (!currentRestaurant) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {currentRegister ? (
        <CashRegisterSidePanel 
          register={currentRegister} 
          currentUser={currentUser} 
        />
      ) : null}

      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {currentRegister 
              ? `Caixa #${currentRegister.id}` 
              : 'Controle de Caixa'}
          </h1>

          {!currentRegister ? (
            <Button 
              onClick={() => setShowOpenModal(true)} 
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <LockOpen className="h-4 w-4" />
              Abrir Caixa
            </Button>
          ) : currentRegister.status === 'open' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAddTransactionModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Entrada / Saída
              </Button>
              <Button
                onClick={() => setShowCloseModal(true)}
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Fechar Caixa
              </Button>
            </div>
          ) : null}
        </div>

        {currentRegister && transactions && (
          <>
            <div className="flex gap-4 mb-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Trash className="h-4 w-4" />
                Excluir Lançamento
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Movimentação
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir Resumo
              </Button>
            </div>

            <CashRegisterTransactions 
              transactions={transactions} 
              registerId={currentRegister.id || ''} 
            />
          </>
        )}

        {!currentRegister && !isLoadingRegister && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                Nenhum caixa aberto. Clique em "Abrir Caixa" para começar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <OpenCashRegisterModal
          showModal={showOpenModal}
          onClose={() => setShowOpenModal(false)}
          onSuccess={handleRefreshData}
          restaurantId={currentRestaurant.id}
        />

        {currentRegister && (
          <>
            <CloseCashRegisterModal
              showModal={showCloseModal}
              onClose={() => setShowCloseModal(false)}
              onSuccess={handleRefreshData}
              registerId={currentRegister.id || ''}
              expectedBalance={calculateExpectedBalance()}
            />

            <AddCashTransactionModal
              showModal={showAddTransactionModal}
              onClose={() => setShowAddTransactionModal(false)}
              onSuccess={handleRefreshData}
              registerId={currentRegister.id || ''}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CashRegisterPage;
