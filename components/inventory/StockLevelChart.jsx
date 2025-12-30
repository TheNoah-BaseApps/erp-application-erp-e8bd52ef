'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StockLevelChart({ transactions }) {
  // Calculate summary statistics
  const summary = transactions.reduce((acc, tx) => {
    if (tx.transaction_type === 'stock_in') {
      acc.totalStockIn += Math.abs(tx.quantity || 0);
    } else if (tx.transaction_type === 'stock_out') {
      acc.totalStockOut += Math.abs(tx.quantity || 0);
    }
    return acc;
  }, { totalStockIn: 0, totalStockOut: 0 });

  const netChange = summary.totalStockIn - summary.totalStockOut;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Stock In</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">+{summary.totalStockIn}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Stock Out</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">-{summary.totalStockOut}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Net Change</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netChange >= 0 ? '+' : ''}{netChange}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}