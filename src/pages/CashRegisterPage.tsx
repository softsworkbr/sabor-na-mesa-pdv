import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentCashRegister, 
  getCashRegisterTransactions
} from '@/utils/restaurant/cashRegisterManagement';
import { CashRegisterTransactions } from '@/components/CashRegisterTransactions';
import { useState } from 'react';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  Clock, 
  User, 
  CalendarClock,
  ArrowUpDown,
  LockOpen,
  Lock
} from 'lucide-react';
import OpenCashRegisterModal from '@/components/modals/OpenCashRegisterModal';
import CloseCashRegisterModal from '@/components/modals/CloseCashRegisterModal';
import AddCashTransactionModal from '@/components/modals/AddCashTransactionModal';

const CashRegisterPage = () => {
  const { currentRestaurant, currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  // Modal states
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

  // Calculate transaction statistics
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
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Controle de Caixa</h1>
          <p className="text-gray-500 mt-1">
            {currentRegister 
              ? `Caixa ${currentRegister.status === 'open' ? 'aberto' : 'fechado'} em ${format(new Date(currentRegister.opened_at || ''), 'dd/MM/yyyy')}`
              : 'Nenhum caixa aberto'
            }
          </p>
        </div>
        
        {!currentRegister ? (
          <Button 
            onClick={() => setShowOpenModal(true)} 
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <LockOpen className="h-4 w-4" />
            Abrir Caixa
          </Button>
        ) : currentRegister.status === 'open' ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowAddTransactionModal(true)} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Nova Transação
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

      {currentRegister && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                Aberto por
              </CardDescription>
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                {currentUser?.name || 'Usuário'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                <CalendarClock className="h-4 w-4 inline mr-1" />
                {format(new Date(currentRegister.opened_at || ''), 'dd/MM/yyyy HH:mm')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-blue-600">
                <DollarSign className="h-4 w-4 mr-1" />
                Saldo Inicial
              </CardDescription>
              <CardTitle className="text-xl">
                {formatCurrency(currentRegister.opening_balance)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                {currentRegister.opening_notes || 'Sem observações'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-green-600">
                <PlusCircle className="h-4 w-4 mr-1" />
                Entradas
              </CardDescription>
              <CardTitle className="text-xl text-green-700">
                {formatCurrency(
                  transactions?.reduce((sum, t) => 
                    t.type === 'payment' || t.type === 'deposit' ? sum + t.amount : sum, 0) || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pagamentos:</span>
                <span className="font-medium">{stats.payments}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Depósitos:</span>
                <span className="font-medium">{stats.deposits}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center text-red-600">
                <MinusCircle className="h-4 w-4 mr-1" />
                Saídas
              </CardDescription>
              <CardTitle className="text-xl text-red-700">
                {formatCurrency(
                  transactions?.reduce((sum, t) => 
                    t.type === 'withdrawal' ? sum + t.amount : sum, 0) || 0
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Retiradas:</span>
                <span className="font-medium">{stats.withdrawals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo Atual:</span>
                <span className="font-medium">{formatCurrency(calculateExpectedBalance())}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentRegister && transactions && (
        <CashRegisterTransactions 
          transactions={transactions} 
          registerId={currentRegister.id || ''} 
        />
      )}

      {!currentRegister && !isLoadingRegister && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Nenhum Caixa Aberto</CardTitle>
            <CardDescription>
              Para começar a registrar transações, você precisa abrir o caixa primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowOpenModal(true)} 
              className="bg-green-600 hover:bg-green-700"
            >
              Abrir Caixa
            </Button>
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
  );
};

export default CashRegisterPage;
