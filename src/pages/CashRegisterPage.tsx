import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentCashRegister, 
  getCashRegisterTransactions,
  getCashRegisterById
} from '@/utils/restaurant/cashRegisterManagement';
import { CashRegisterTransactionsTable } from '@/components/CashRegisterTransactionsTable';
import { CashRegisterSidePanelNew } from '@/components/CashRegisterSidePanelNew';
import { CashRegisterSummary } from '@/components/CashRegisterSummary';
import { LockOpen, Lock, Plus, Printer, Trash, History, ArrowLeft } from 'lucide-react';
import OpenCashRegisterModal from '@/components/modals/OpenCashRegisterModal';
import CloseCashRegisterModal from '@/components/modals/CloseCashRegisterModal';
import AddCashTransactionModal from '@/components/modals/AddCashTransactionModal';
import CashRegisterHistoryModal from '@/components/modals/CashRegisterHistoryModal';
import { CashRegister } from '@/utils/restaurant/cashRegisterTypes';

const CashRegisterPage = () => {
  const { currentRestaurant, currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoricalRegisterId, setSelectedHistoricalRegisterId] = useState<string | null>(null);
  const [historicalRegister, setHistoricalRegister] = useState<CashRegister | null>(null);

  const { data: currentRegister, refetch: refetchRegister, isLoading: isLoadingRegister } = useQuery({
    queryKey: ['currentRegister', currentRestaurant?.id],
    queryFn: () => getCurrentCashRegister(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  const { data: transactions, refetch: refetchTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['registerTransactions', selectedHistoricalRegisterId || currentRegister?.id],
    queryFn: () => getCashRegisterTransactions(selectedHistoricalRegisterId || currentRegister?.id || ''),
    enabled: !!(selectedHistoricalRegisterId || currentRegister?.id),
  });

  // Fetch historical register when selected
  useEffect(() => {
    const fetchHistoricalRegister = async () => {
      if (selectedHistoricalRegisterId) {
        try {
          const register = await getCashRegisterById(selectedHistoricalRegisterId);
          setHistoricalRegister(register);
        } catch (error) {
          console.error('Error fetching historical register:', error);
          setHistoricalRegister(null);
        }
      } else {
        setHistoricalRegister(null);
      }
    };

    fetchHistoricalRegister();
  }, [selectedHistoricalRegisterId]);

  const handleRefreshData = () => {
    refetchRegister();
    refetchTransactions();
  };

  const handleSelectHistoricalRegister = (registerId: string) => {
    setSelectedHistoricalRegisterId(registerId);
    setShowHistoryModal(false);
  };

  const handleBackToCurrentRegister = () => {
    setSelectedHistoricalRegisterId(null);
    setHistoricalRegister(null);
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

  // Determine which register to display (current or historical)
  const displayRegister = historicalRegister || currentRegister;

  if (!currentRestaurant) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar */}
      {displayRegister ? (
        <CashRegisterSidePanelNew 
          register={displayRegister} 
          currentUser={currentUser} 
        />
      ) : (
        <div className="w-80 bg-gray-800 text-white h-full flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-bold mb-6">Nenhum Caixa Aberto</h2>
          <p className="text-center mb-6">
            Para começar a registrar transações, você precisa abrir o caixa primeiro.
          </p>
          <div className="space-y-3 w-full">
            <Button 
              onClick={() => setShowOpenModal(true)} 
              className="bg-green-500 hover:bg-green-600 w-full"
            >
              <LockOpen className="h-4 w-4 mr-2" />
              Abrir Caixa
            </Button>
            <Button 
              onClick={() => setShowHistoryModal(true)} 
              variant="outline"
              className="w-full text-white border-white hover:bg-gray-700"
            >
              <History className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Transactions area */}
          <div className="flex-1 p-4 overflow-auto">
            {displayRegister ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    {selectedHistoricalRegisterId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleBackToCurrentRegister}
                        className="mr-2"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Voltar
                      </Button>
                    )}
                    <h1 className="text-xl font-bold">
                      {selectedHistoricalRegisterId ? (
                        <>Histórico: Caixa #{displayRegister.id?.substring(0, 6)}</>
                      ) : (
                        <>Caixa de {currentUser?.name || 'Usuário'} - ID: {displayRegister.id?.substring(0, 6)}</>
                      )}
                    </h1>
                  </div>
                  <div className="flex gap-2">
                    {!selectedHistoricalRegisterId && currentRegister?.status === 'open' ? (
                      <>
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
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowHistoryModal(true)}
                        className="flex items-center gap-2"
                      >
                        <History className="h-4 w-4" />
                        Ver Outro Caixa
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  {!selectedHistoricalRegisterId && (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Trash className="h-4 w-4" />
                      Excluir Lançamento
                    </Button>
                  )}
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
                    registerId={displayRegister.id || ''} 
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Card className="max-w-md">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500 mb-4">
                      Nenhum caixa aberto. Clique em "Abrir Caixa" para começar ou "Ver Histórico" para visualizar caixas fechados.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => setShowOpenModal(true)} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <LockOpen className="h-4 w-4 mr-2" />
                        Abrir Caixa
                      </Button>
                      <Button 
                        onClick={() => setShowHistoryModal(true)} 
                        variant="outline"
                      >
                        <History className="h-4 w-4 mr-2" />
                        Ver Histórico
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right summary panel */}
          {displayRegister && transactions && (
            <div className="w-80 border-l p-4 overflow-auto">
              <CashRegisterSummary 
                transactions={transactions}
                initialBalance={displayRegister.opening_balance}
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

      <CashRegisterHistoryModal
        showModal={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectRegister={handleSelectHistoricalRegister}
        restaurantId={currentRestaurant.id}
      />
    </div>
  );
};

export default CashRegisterPage;
