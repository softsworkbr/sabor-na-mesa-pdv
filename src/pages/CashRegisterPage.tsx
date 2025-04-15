
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentCashRegister, 
  openCashRegister, 
  closeCashRegister,
  getCashRegisterTransactions
} from '@/utils/restaurant/cashRegisterManagement';
import { CashRegisterTransactions } from '@/components/CashRegisterTransactions';
import { useState } from 'react';
import { formatCurrency } from '@/utils/format';

const CashRegisterPage = () => {
  const { currentRestaurant } = useAuth();
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const { data: currentRegister, refetch: refetchRegister } = useQuery({
    queryKey: ['currentRegister', currentRestaurant?.id],
    queryFn: () => getCurrentCashRegister(currentRestaurant?.id || ''),
    enabled: !!currentRestaurant?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['registerTransactions', currentRegister?.id],
    queryFn: () => getCashRegisterTransactions(currentRegister?.id || ''),
    enabled: !!currentRegister?.id,
  });

  const handleOpenRegister = async () => {
    if (!currentRestaurant?.id || !openingBalance) return;
    
    try {
      await openCashRegister({
        restaurant_id: currentRestaurant.id,
        opening_balance: Number(openingBalance),
        opening_notes: openingNotes,
      });
      refetchRegister();
      setOpeningBalance('');
      setOpeningNotes('');
    } catch (error: any) {
      toast.error('Erro ao abrir o caixa');
    }
  };

  const handleCloseRegister = async () => {
    if (!currentRegister?.id || !closingBalance) return;
    
    try {
      await closeCashRegister(currentRegister.id, {
        closing_balance: Number(closingBalance),
        closing_notes: closingNotes,
      });
      refetchRegister();
      setClosingBalance('');
      setClosingNotes('');
    } catch (error: any) {
      toast.error('Erro ao fechar o caixa');
    }
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
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Caixa</h1>

      {!currentRegister ? (
        <Card>
          <CardHeader>
            <CardTitle>Abrir Caixa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openingBalance">Saldo Inicial</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0,00"
              />
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
            <Button onClick={handleOpenRegister} className="w-full">
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Saldo Inicial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(currentRegister.opening_balance)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saldo Atual (Esperado)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(calculateExpectedBalance())}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold capitalize">
                  {currentRegister.status === 'open' ? 'Aberto' : 'Fechado'}
                </p>
              </CardContent>
            </Card>
          </div>

          {currentRegister.status === 'open' && (
            <Card>
              <CardHeader>
                <CardTitle>Fechar Caixa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="closingBalance">Saldo Final</Label>
                  <Input
                    id="closingBalance"
                    type="number"
                    step="0.01"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingNotes">Observações</Label>
                  <Input
                    id="closingNotes"
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Observações sobre o fechamento do caixa"
                  />
                </div>
                <Button onClick={handleCloseRegister} className="w-full">
                  Fechar Caixa
                </Button>
              </CardContent>
            </Card>
          )}

          <CashRegisterTransactions 
            transactions={transactions || []} 
            registerId={currentRegister.id} 
          />
        </>
      )}
    </div>
  );
};

export default CashRegisterPage;
