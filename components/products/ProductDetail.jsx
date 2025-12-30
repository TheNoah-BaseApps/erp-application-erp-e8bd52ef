'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StockAdjustmentModal from './StockAdjustmentModal';
import DataTable from '@/components/common/DataTable';
import { formatCurrency, formatDateTime, isStockCritical } from '@/lib/utils';
import { Pencil, Package } from 'lucide-react';
import AlertBanner from '@/components/common/AlertBanner';

export default function ProductDetail({ product, recentTransactions, onRefresh }) {
  const router = useRouter();
  const [showStockModal, setShowStockModal] = useState(false);

  const transactionColumns = [
    { 
      key: 'transaction_date', 
      label: 'Date',
      render: (value) => formatDateTime(value)
    },
    { 
      key: 'transaction_type', 
      label: 'Type',
      render: (value) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          value === 'stock_in' ? 'bg-green-100 text-green-800' :
          value === 'stock_out' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reference_number', label: 'Reference' },
    { key: 'created_by_name', label: 'Created By' }
  ];

  return (
    <div className="space-y-6">
      {isStockCritical(product.current_stock, product.critical_stock_level) && (
        <AlertBanner
          type="warning"
          message={`Stock level is critical! Current: ${product.current_stock}, Critical Level: ${product.critical_stock_level}`}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Details</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStockModal(true)}
              >
                <Package className="mr-2 h-4 w-4" />
                Adjust Stock
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Product Code</p>
              <p className="font-medium">{product.product_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Product Name</p>
              <p className="font-medium">{product.product_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{product.product_category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Brand</p>
              <p className="font-medium">{product.brand || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit</p>
              <p className="font-medium">{product.unit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <p className={`font-medium ${isStockCritical(product.current_stock, product.critical_stock_level) ? 'text-red-600' : ''}`}>
                {product.current_stock}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical Stock Level</p>
              <p className="font-medium">{product.critical_stock_level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit Cost</p>
              <p className="font-medium">{formatCurrency(product.unit_cost)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Selling Price</p>
              <p className="font-medium">{formatCurrency(product.selling_price)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{product.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{product.created_by_name || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions && recentTransactions.length > 0 ? (
            <DataTable
              data={recentTransactions}
              columns={transactionColumns}
            />
          ) : (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>

      <StockAdjustmentModal
        open={showStockModal}
        onOpenChange={setShowStockModal}
        product={product}
        onSuccess={() => {
          setShowStockModal(false);
          onRefresh();
        }}
      />
    </div>
  );
}