'use client';

import MetricsCard from '@/components/common/MetricsCard';
import { Package, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardMetrics({ metrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Total Products"
        value={metrics?.products?.total || 0}
        icon={Package}
        trend={`${metrics?.products?.active || 0} active`}
      />

      <MetricsCard
        title="Low Stock Items"
        value={metrics?.products?.lowStock || 0}
        icon={AlertTriangle}
        className={metrics?.products?.lowStock > 0 ? 'border-yellow-200' : ''}
      />

      <MetricsCard
        title="Total Customers"
        value={metrics?.customers?.total || 0}
        icon={Users}
        trend={`${metrics?.customers?.active || 0} active`}
      />

      <MetricsCard
        title="At-Risk Customers"
        value={metrics?.customers?.atRisk || 0}
        icon={AlertTriangle}
        className={metrics?.customers?.atRisk > 0 ? 'border-red-200' : ''}
      />

      <MetricsCard
        title="Outstanding Balance"
        value={formatCurrency(metrics?.customers?.totalOutstanding || 0)}
        icon={DollarSign}
      />

      <MetricsCard
        title="Inventory Value"
        value={formatCurrency(metrics?.inventory?.totalValue || 0)}
        icon={Package}
      />
    </div>
  );
}