'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ExportButton from '@/components/common/ExportButton';
import { formatCurrency } from '@/lib/utils';
import { prepareCustomersForExport } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerTable({ customers, pagination, onPageChange, onRefresh }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      toast.success('Customer deleted successfully');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'customer_code', label: 'Code' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'city_or_district', label: 'City' },
    { key: 'telephone_number', label: 'Phone' },
    { 
      key: 'current_balance', 
      label: 'Balance',
      render: (value, row) => (
        <span className={value >= row.balance_risk_limit ? 'text-red-600 font-semibold' : ''}>
          {formatCurrency(value)}
        </span>
      )
    },
    { key: 'sales_rep_name', label: 'Sales Rep' },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (value) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/customers/${value}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/customers/${value}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteId(value)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <ExportButton
          data={customers}
          filename="customers"
          prepareData={prepareCustomersForExport}
          title="Customers Report"
        />
      </div>

      <DataTable
        data={customers}
        columns={columns}
        pagination={pagination}
        onPageChange={onPageChange}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
      />
    </>
  );
}