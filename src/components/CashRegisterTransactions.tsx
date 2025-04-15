import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { CashRegisterTransaction } from '@/utils/restaurant/cashRegisterTypes';
import { PlusCircle, MinusCircle, CreditCard, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CashRegisterTransactionsProps {
  transactions: CashRegisterTransaction[];
  registerId: string;
}

const typeLabels = {
  payment: 'Pagamento',
  withdrawal: 'Retirada',
  deposit: 'Depósito'
};

const typeIcons = {
  payment: <CreditCard className="h-4 w-4" />,
  withdrawal: <MinusCircle className="h-4 w-4" />,
  deposit: <PlusCircle className="h-4 w-4" />
};

const typeColors = {
  payment: 'bg-blue-100 text-blue-800',
  withdrawal: 'bg-red-100 text-red-800',
  deposit: 'bg-green-100 text-green-800'
};

export const CashRegisterTransactions = ({ transactions }: CashRegisterTransactionsProps) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    return (
      typeLabels[transaction.type].toLowerCase().includes(searchLower) ||
      transaction.notes?.toLowerCase().includes(searchLower) ||
      format(new Date(transaction.created_at || ''), 'dd/MM/yyyy').includes(searchTerm)
    );
  });

  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'payment' || transaction.type === 'deposit') {
      acc.income += transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      acc.expense += transaction.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <Card className="mt-2">
      <CardContent className="p-0">
        <div className="rounded-md border overflow-hidden">
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
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-gray-50">
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
                  <TableCell>{transaction.payment_method_id ? 'Cartão' : 'Dinheiro'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                      .format(transaction.balance)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {searchTerm 
                      ? 'Nenhuma transação encontrada para esta busca' 
                      : 'Nenhuma transação registrada'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
