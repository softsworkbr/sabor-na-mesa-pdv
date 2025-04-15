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

  // Calculate totals
  const totals = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'payment' || transaction.type === 'deposit') {
      acc.income += transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      acc.expense += transaction.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <CardTitle className="text-2xl font-bold">Transações</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600 font-medium">Total de Transações</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-600 font-medium">Total de Entradas</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.income)}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-sm text-red-600 font-medium">Total de Saídas</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.expense)}</p>
          </div>
        </div>
        
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[180px]">Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{format(new Date(transaction.created_at || ''), 'dd/MM/yyyy')}</span>
                      <span className="text-xs text-gray-500">{format(new Date(transaction.created_at || ''), 'HH:mm')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`flex items-center gap-1 ${typeColors[transaction.type]}`}>
                      {typeIcons[transaction.type]}
                      {typeLabels[transaction.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    transaction.type === 'withdrawal' 
                      ? 'text-red-600' 
                      : transaction.type === 'deposit'
                        ? 'text-green-600'
                        : 'text-blue-600'
                  }`}>
                    {transaction.type === 'withdrawal' ? '- ' : '+ '}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
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
