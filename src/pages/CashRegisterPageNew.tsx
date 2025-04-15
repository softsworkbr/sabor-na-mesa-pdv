import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentCashRegister, 
  getCashRegisterTransactions
} from '@/utils/restaurant/cashRegisterManagement';
import { CashRegisterTransactionsTable } from '@/components/CashRegisterTransactionsTable';
import { CashRegisterSidePanelNew } from '@/components/CashRegisterSidePanelNew';
import { CashRegisterSummary } from '@/components/CashRegisterSummary';
import { LockOpen, Lock, Plus, Printer, Trash } from 'lucide-react';
import OpenCashRegisterModal from '@/components/modals/OpenCashRegisterModal';
import CloseCashRegisterModal from '@/components/modals/CloseCashRegisterModal';
import AddCashTransactionModal from '@/components/modals/AddCashTransactionModal';

const CashRegisterPageNew = () => {
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

  if (!currentRestaurant) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar */}
      {currentRegister ? (
        <CashRegisterSidePanelNew 
          register={currentRegister} 
          currentUser={currentUser} 
        />
      ) : (
        <div className="w-80 bg-gray-800 text-white h-full flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-bold mb-6">Nenhum Caixa Aberto</h2>
          <p className="text-center mb-6">
            Para começar a registrar transações, você precisa abrir o caixa primeiro.
          </p>
          <Button 
            onClick={() => setShowOpenModal(true)} 
            className="bg-green-500 hover:bg-green-600 w-full"
          >
            <LockOpen className="h-4 w-4 mr-2" />
            Abrir Caixa
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Transactions area */}
          <div className="flex-1 p-4 overflow-auto">
            {currentRegister ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-xl font-bold">
                    Caixa de {currentUser?.name || 'Usuário'} - ID: {currentRegister.id.substring(0, 6)}
                  </h1>
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
                </div>

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

                {transactions && (
                  <CashRegisterTransactionsTable 
                    transactions={transactions} 
                    registerId={currentRegister.id || ''} 
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Card className="max-w-md">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500 mb-4">
                      Nenhum caixa aberto. Clique em "Abrir Caixa" para começar.
                    </p>
                    <Button 
                      onClick={() => setShowOpenModal(true)} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <LockOpen className="h-4 w-4 mr-2" />
                      Abrir Caixa
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right summary panel */}
          {currentRegister && transactions && (
            <div className="w-80 border-l p-4 overflow-auto">
              <CashRegisterSummary 
                transactions={transactions}
                initialBalance={currentRegister.opening_balance}
              />
            </div>
          )}
        </div>
      </div>

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
  );
};

export default CashRegisterPageNew;
