'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/common/DataTable';
import AlertBanner from '@/components/common/AlertBanner';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function AtRiskCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAtRiskCustomers();
  }, []);

  const fetchAtRiskCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customers/at-risk', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch at-risk customers');
      }

      const data = await response.json();
      setCustomers(data.data.customers);
    } catch (err) {
      console.error('Error fetching at-risk customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'customer_code', label: 'Code' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'city_or_district', label: 'City' },
    { 
      key: 'current_balance', 
      label: 'Current Balance',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'balance_risk_limit', 
      label: 'Risk Limit',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'over_limit_amount', 
      label: 'Over Limit',
      render: (value) => (
        <span className="font-semibold text-red-600">
          {formatCurrency(value)}
        </span>
      )
    },
    { key: 'sales_rep_name', label: 'Sales Rep' },
    {
      key: 'id',
      label: 'Actions',
      render: (value) => (
        <button
          onClick={() => router.push(`/customers/${value}`)}
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
        <h1 className="text-3xl font-bold">At-Risk Customers</h1>
      </div>

      {!loading && customers.length > 0 && (
        <AlertBanner
          type="error"
          message={`${customers.length} customer(s) exceeding balance risk limit`}
        />
      )}

      {loading ? (
        <Skeleton className="h-96" />
      ) : customers.length === 0 ? (
        <Alert>
          <AlertDescription>
            No customers exceeding balance risk limit. All customer balances are within limits!
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          data={customers}
          columns={columns}
        />
      )}
    </div>
  );
}