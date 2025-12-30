'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import ExportButton from '@/components/common/ExportButton';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { prepareInventoryForExport, prepareCustomerTransactionsForExport } from '@/lib/export';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportTable({ type, filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
  }, [type, filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters);
      const url = type === 'inventory' 
        ? `/api/reports/inventory?${params}`
        : `/api/reports/customers?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inventoryColumns = [
    { 
      key: 'transaction_date', 
      label: 'Date',
      render: (value) => formatDateTime(value)
    },
    { key: 'product_code', label: 'Product Code' },
    { key: 'product_name', label: 'Product Name' },
    { 
      key: 'transaction_type', 
      label: 'Type',
      render: (value) => value?.replace('_', ' ')
    },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reference_number', label: 'Reference' }
  ];

  const customerColumns = [
    { 
      key: 'transaction_date', 
      label: 'Date',
      render: (value) => formatDateTime(value)
    },
    { key: 'customer_code', label: 'Customer Code' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'transaction_type', label: 'Type' },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (value) => formatCurrency(value)
    },
    { key: 'reference_number', label: 'Reference' }
  ];

  if (loading) {
    return <Skeleton className="h-96" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns = type === 'inventory' ? inventoryColumns : customerColumns;
  const transactions = data?.transactions || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{summary.totalTransactions || 0}</p>
            </div>
            {type === 'inventory' ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Total Stock In</p>
                  <p className="text-2xl font-bold text-green-600">+{summary.totalStockIn || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Stock Out</p>
                  <p className="text-2xl font-bold text-red-600">-{summary.totalStockOut || 0}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.totalSales || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPayments || 0)}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <ExportButton
          data={transactions}
          filename={`${type}-report`}
          prepareData={type === 'inventory' ? prepareInventoryForExport : prepareCustomerTransactionsForExport}
          title={`${type === 'inventory' ? 'Inventory' : 'Customer'} Report`}
        />
      </div>

      <DataTable
        data={transactions}
        columns={columns}
      />
    </div>
  );
}