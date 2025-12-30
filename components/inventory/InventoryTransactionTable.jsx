'use client';

import DataTable from '@/components/common/DataTable';
import ExportButton from '@/components/common/ExportButton';
import { formatDateTime } from '@/lib/utils';
import { prepareInventoryForExport } from '@/lib/export';

export default function InventoryTransactionTable({ transactions, onRefresh }) {
  const columns = [
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
      render: (value) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          value === 'stock_in' ? 'bg-green-100 text-green-800' :
          value === 'stock_out' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value?.replace('_', ' ')}
        </span>
      )
    },
    { 
      key: 'quantity', 
      label: 'Quantity',
      render: (value, row) => (
        <span className={
          row.transaction_type === 'stock_in' ? 'text-green-600' :
          row.transaction_type === 'stock_out' ? 'text-red-600' :
          ''
        }>
          {row.transaction_type === 'stock_in' ? '+' : row.transaction_type === 'stock_out' ? '-' : ''}
          {value}
        </span>
      )
    },
    { key: 'reference_number', label: 'Reference' },
    { key: 'notes', label: 'Notes' },
    { key: 'created_by_name', label: 'Created By' }
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <ExportButton
          data={transactions}
          filename="inventory-transactions"
          prepareData={prepareInventoryForExport}
          title="Inventory Transactions Report"
        />
      </div>

      <DataTable
        data={transactions}
        columns={columns}
      />
    </>
  );
}