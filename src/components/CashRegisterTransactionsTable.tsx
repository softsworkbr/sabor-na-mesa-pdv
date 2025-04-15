import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { CashRegisterTransaction } from '@/utils/restaurant/cashRegisterTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getPaymentMethods } from '@/utils/restaurant/services/paymentService';
import { PaymentMethod } from '@/utils/restaurant/types/orderTypes';

interface CashRegisterTransactionsTableProps {
  transactions: CashRegisterTransaction[];
  registerId: string;
}

export const CashRegisterTransactionsTable = ({ transactions }: CashRegisterTransactionsTableProps) => {
  const [showEstimatedPayments, setShowEstimatedPayments] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
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

  // Get payment method name by ID
  const getPaymentMethodName = (methodId: string | null | undefined): string => {
    if (!methodId) return 'Dinheiro';
    
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.name : 'Desconhecido';
  };

  // Calculate running balance
  const transactionsWithBalance = transactions.map((transaction, index) => {
    return {
      ...transaction,
      runningBalance: transaction.balance || 0
    };
  });

  // Calculate final balance
  const calculateFinalBalance = (): number => {
    if (transactions.length === 0) return 0;
    
    // Get the last transaction's balance
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.created_at || '');
      const dateB = new Date(b.created_at || '');
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedTransactions[0].balance || 0;
  };

  return (
    <Card className="mt-2 border-0">
      <CardContent className="p-0">
        <div className="p-2 border-b">
          <div className="flex items-center">
            <Checkbox 
              id="showEstimated" 
              checked={showEstimatedPayments}
              onCheckedChange={(checked) => setShowEstimatedPayments(checked as boolean)}
            />
            <label htmlFor="showEstimated" className="ml-2 text-sm text-gray-600 cursor-pointer">
              Exibir pagamentos estornados e descontos de pedidos
            </label>
          </div>
        </div>
        
        <div className="rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-[180px]">Data / Hora</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Saída</TableHead>
                <TableHead>Forma Pagto.</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsWithBalance.map((transaction) => (
                <TableRow 
                  key={transaction.id} 
                  className={`hover:bg-gray-50 ${selectedTransactionId === transaction.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedTransactionId(transaction.id)}
                >
                  <TableCell className="font-medium">
                    {format(new Date(transaction.created_at || ''), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{transaction.notes || '-'}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {transaction.type !== 'withdrawal' 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(transaction.amount)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {transaction.type === 'withdrawal'
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(transaction.amount)
                      : '-'}
                  </TableCell>
                  <TableCell>{getPaymentMethodName(transaction.payment_method_id)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(transaction.runningBalance)}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhuma transação registrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-3 border-t flex justify-between">
          <div className="text-sm text-gray-500">
            Total: {transactions.length} registro(s)
          </div>
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Total:</span>{' '}
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(calculateFinalBalance())}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
