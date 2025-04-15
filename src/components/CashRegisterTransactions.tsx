
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

interface CashRegisterTransactionsProps {
  transactions: CashRegisterTransaction[];
  registerId: string;
}

const typeLabels = {
  payment: 'Pagamento',
  withdrawal: 'Retirada',
  deposit: 'Depósito'
};

export const CashRegisterTransactions = ({ transactions }: CashRegisterTransactionsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Transações</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm')}
              </TableCell>
              <TableCell>{typeLabels[transaction.type]}</TableCell>
              <TableCell className={
                transaction.type === 'withdrawal' 
                  ? 'text-red-500' 
                  : 'text-green-500'
              }>
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell>{transaction.notes || '-'}</TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
