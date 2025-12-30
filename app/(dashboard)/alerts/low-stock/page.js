'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import AlertBanner from '@/components/common/AlertBanner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function LowStockPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/low-stock', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch low stock products');
      }

      const data = await response.json();
      setProducts(data.data.products);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'product_code', label: 'Code' },
    { key: 'product_name', label: 'Product Name' },
    { key: 'product_category', label: 'Category' },
    { key: 'current_stock', label: 'Current Stock' },
    { key: 'critical_stock_level', label: 'Critical Level' },
    { 
      key: 'stock_deficit', 
      label: 'Deficit',
      render: (value) => (
        <span className="font-semibold text-red-600">
          {value}
        </span>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => router.push(`/products/${value}`)}
          className="text-blue-600 hover:text-blue-800"
        >
          View Details
        </button>
      )
    }
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
        <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
      </div>

      {!loading && products.length > 0 && (
        <AlertBanner
          type="warning"
          message={`${products.length} product(s) below critical stock level`}
        />
      )}

      {loading ? (
        <Skeleton className="h-96" />
      ) : products.length === 0 ? (
        <Alert>
          <AlertDescription>
            No products below critical stock level. All inventory levels are healthy!
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          data={products}
          columns={columns}
        />
      )}
    </div>
  );
}