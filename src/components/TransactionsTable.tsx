
import { format } from 'date-fns';
import { Transaction } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TransactionsTableProps {
  transactions: Transaction[];
}

export const TransactionsTable = ({ transactions }: TransactionsTableProps) => {
  if (transactions.length === 0) {
    return <p className="text-muted-foreground">No transactions available.</p>;
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Confirmations</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
              <TableCell>{transaction.amount.toLocaleString()} KSH</TableCell>
              <TableCell>{transaction.confirmations}</TableCell>
              <TableCell>{transaction.label}</TableCell>
              <TableCell>{format(new Date(transaction.createdAt), 'PPP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
