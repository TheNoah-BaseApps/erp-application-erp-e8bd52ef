'use client';

import { useRouter } from 'next/navigation';
import CustomerForm from '@/components/customers/CustomerForm';
import Breadcrumb from '@/components/layout/Breadcrumb';

export default function NewCustomerPage() {
  const router = useRouter();

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Customers', href: '/customers' },
    { label: 'New Customer', href: '#' }
  ];

  const handleSuccess = () => {
    router.push('/customers');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Customer</h1>
      </div>
      <CustomerForm onSuccess={handleSuccess} />
    </div>
  );
}