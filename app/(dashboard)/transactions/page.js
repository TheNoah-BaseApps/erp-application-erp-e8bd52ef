'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/customers', {
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

  const columns = [
    { 
      key: 'transaction_date', 
      label: 'Date',
      render: (value) => formatDateTime(value)
    },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_code', label: 'Code' },
    { 
      key: 'transaction_type', 
      label: 'Type',
      render: (value) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          value === 'sale' ? 'bg-blue-100 text-blue-800' :
          value === 'payment' ? 'bg-green-100 text-green-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    { key: 'reference_number', label: 'Reference' },
    { key: 'created_by_name', label: 'Created By' }
  ];

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
        <h1 className="text-3xl font-bold">Customer Transactions</h1>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <DataTable
          data={transactions}
          columns={columns}
        />
      )}
    </div>
  );
}