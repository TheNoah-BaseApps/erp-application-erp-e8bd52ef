'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/products/ProductForm';
import Breadcrumb from '@/components/layout/Breadcrumb';

export default function NewProductPage() {
  const router = useRouter();

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Products', href: '/products' },
    { label: 'New Product', href: '#' }
  ];

  const handleSuccess = () => {
    router.push('/products');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Product</h1>
      </div>
      <ProductForm onSuccess={handleSuccess} />
    </div>
  );
}