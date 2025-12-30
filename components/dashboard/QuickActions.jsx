'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, AlertTriangle, FileText } from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Add Product',
      icon: Plus,
      onClick: () => router.push('/products/new'),
      variant: 'default'
    },
    {
      label: 'Add Customer',
      icon: Plus,
      onClick: () => router.push('/customers/new'),
      variant: 'default'
    },
    {
      label: 'View Low Stock',
      icon: AlertTriangle,
      onClick: () => router.push('/alerts/low-stock'),
      variant: 'outline'
    },
    {
      label: 'View Reports',
      icon: FileText,
      onClick: () => router.push('/reports'),
      variant: 'outline'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Button
                key={i}
                variant={action.variant}
                onClick={action.onClick}
                className="h-auto flex-col gap-2 py-4"
              >
                <Icon className="h-6 w-6" />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}