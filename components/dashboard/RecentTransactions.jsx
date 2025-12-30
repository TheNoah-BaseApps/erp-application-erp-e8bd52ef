'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RecentTransactions({ inventoryTransactions, customerTransactions }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="inventory">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4 mt-4">
            {inventoryTransactions && inventoryTransactions.length > 0 ? (
              inventoryTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{tx.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {tx.transaction_type?.replace('_', ' ')} • {formatDateTime(tx.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.transaction_type === 'stock_in' ? 'text-green-600' : 
                      tx.transaction_type === 'stock_out' ? 'text-red-600' : ''
                    }`}>
                      {tx.transaction_type === 'stock_in' ? '+' : tx.transaction_type === 'stock_out' ? '-' : ''}
                      {tx.quantity}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent inventory transactions</p>
            )}
          </TabsContent>

          <TabsContent value="customers" className="space-y-4 mt-4">
            {customerTransactions && customerTransactions.length > 0 ? (
              customerTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{tx.customer_name}</p>
                    <p className="text-sm text-gray-500">
                      {tx.transaction_type} • {formatDateTime(tx.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.transaction_type === 'sale' ? 'text-blue-600' : 
                      tx.transaction_type === 'payment' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent customer transactions</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}