'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/common/DataTable';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ExportButton from '@/components/common/ExportButton';
import { formatCurrency } from '@/lib/utils';
import { prepareProductsForExport } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductTable({ products, pagination, onPageChange, onRefresh }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted successfully');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'product_code', label: 'Code' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'product_category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { 
      key: 'current_stock', 
      label: 'Stock',
      render: (value, row) => (
        <span className={value <= row.critical_stock_level ? 'text-red-600 font-semibold' : ''}>
          {value}
        </span>
      )
    },
    { 
      key: 'unit_cost', 
      label: 'Unit Cost',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'selling_price', 
      label: 'Selling Price',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (value) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/products/${value}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/products/${value}`)}
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
          data={products}
          filename="products"
          prepareData={prepareProductsForExport}
          title="Products Report"
        />
      </div>

      <DataTable
        data={products}
        columns={columns}
        pagination={pagination}
        onPageChange={onPageChange}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
      />
    </>
  );
}