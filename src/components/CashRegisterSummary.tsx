import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CashRegisterTransaction } from '@/utils/restaurant/cashRegisterTypes';
import { getPaymentMethods } from '@/utils/restaurant/services/paymentService';
import { PaymentMethod } from '@/utils/restaurant/types/orderTypes';

interface CashRegisterSummaryProps {
  transactions: CashRegisterTransaction[];
  initialBalance: number;
}

export const CashRegisterSummary = ({ transactions, initialBalance }: CashRegisterSummaryProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoadingPaymentMethods(true);
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setIsLoadingPaymentMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Calculate totals
  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'payment' || transaction.type === 'deposit') {
      acc.income += transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      acc.expense += transaction.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  // Calculate totals by payment method
  const paymentMethodTotals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'payment' && transaction.payment_method_id) {
      if (!acc[transaction.payment_method_id]) {
        acc[transaction.payment_method_id] = 0;
      }
      acc[transaction.payment_method_id] += transaction.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate cash total (transactions without payment_method_id)
  const cashTotal = transactions.reduce((total, transaction) => {
    if ((transaction.type === 'payment' && !transaction.payment_method_id) ||
      transaction.type === 'deposit') {
      return total + transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      return total - transaction.amount;
    }
    return total;
  }, initialBalance);

  const finalBalance = initialBalance + totals.income - totals.expense;

  // Get payment method name by ID
  const getPaymentMethodName = (methodId: string): string => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.name : 'Desconhecido';
  };

  return (
    <Card className="border-0 bg-amber-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700 font-medium">(+) SALDO INICIAL:</span>
              <span className="font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(initialBalance)}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700 font-medium">(+) ENTRADAS NO CAIXA</span>
              <span className="font-bold text-green-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(totals.income)}
              </span>
            </div>
            {totals.income === 0 ? (
              <p className="text-sm text-gray-500 italic">Não há registros de entrada</p>
            ) : (
              <div className="pl-4 space-y-1 mt-2">
                {/* Resumo por forma de pagamento */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dinheiro de entrada:</span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(transactions.reduce((total, t) =>
                        (t.type === 'payment' && !t.payment_method_id) || t.type === 'deposit'
                          ? total + t.amount
                          : total, 0))}
                  </span>
                </div>

                {/* Outros métodos de pagamento */}
                {Object.entries(paymentMethodTotals).map(([methodId, amount]) => (
                  <div key={methodId} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{getPaymentMethodName(methodId)}:</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700 font-medium">(-) SAÍDAS DO CAIXA</span>
              <span className="font-bold text-red-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(totals.expense)}
              </span>
            </div>
            {totals.expense === 0 ? (
              <p className="text-sm text-gray-500 italic">Não há registros de saída</p>
            ) : null}
          </div>

          <div className="pt-4 border-t border-amber-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700 font-medium">(=) SALDO FINAL</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700">Somente Dinheiro:</span>
              <span className="font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(cashTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700">TUDO:</span>
              <span className="font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(finalBalance)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
