'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionModal from './TransactionModal';
import DataTable from '@/components/common/DataTable';
import { formatCurrency, formatDateTime, isBalanceAtRisk } from '@/lib/utils';
import { Pencil, Receipt } from 'lucide-react';
import AlertBanner from '@/components/common/AlertBanner';

export default function CustomerDetail({ customer, recentTransactions, onRefresh }) {
  const router = useRouter();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

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
          value === 'sale' ? 'bg-blue-100 text-blue-800' :
          value === 'payment' ? 'bg-green-100 text-green-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value.replace('_', ' ')}
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

  return (
    <div className="space-y-6">
      {isBalanceAtRisk(customer.current_balance, customer.balance_risk_limit) && (
        <AlertBanner
          type="error"
          message={`Customer balance exceeds risk limit! Current: ${formatCurrency(customer.current_balance)}, Limit: ${formatCurrency(customer.balance_risk_limit)}`}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Details</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransactionModal(true)}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/customers/${customer.id}`)}
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
              <p className="text-sm text-gray-500">Customer Code</p>
              <p className="font-medium">{customer.customer_code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">{customer.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="font-medium">{customer.contact_person || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{customer.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telephone</p>
              <p className="font-medium">{customer.telephone_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{customer.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">City/District</p>
              <p className="font-medium">{customer.city_or_district || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Region/State</p>
              <p className="font-medium">{customer.region_or_state || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Country</p>
              <p className="font-medium">{customer.country || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className={`font-medium ${isBalanceAtRisk(customer.current_balance, customer.balance_risk_limit) ? 'text-red-600' : ''}`}>
                {formatCurrency(customer.current_balance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Balance Risk Limit</p>
              <p className="font-medium">{formatCurrency(customer.balance_risk_limit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Terms</p>
              <p className="font-medium">{customer.payment_terms_limit} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sales Rep</p>
              <p className="font-medium">{customer.sales_rep_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{customer.status}</p>
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

      <TransactionModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        customer={customer}
        onSuccess={() => {
          setShowTransactionModal(false);
          onRefresh();
        }}
      />
    </div>
  );
}