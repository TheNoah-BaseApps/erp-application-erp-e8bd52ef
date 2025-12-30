'use client';

import { useState, useEffect } from 'react';
import InventoryTransactionTable from '@/components/inventory/InventoryTransactionTable';
import StockLevelChart from '@/components/inventory/StockLevelChart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data.transactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Transactions</h1>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </>
      ) : (
        <>
          <StockLevelChart transactions={transactions} />
          <InventoryTransactionTable 
            transactions={transactions}
            onRefresh={fetchTransactions}
          />
        </>
      )}
    </div>
  );
}