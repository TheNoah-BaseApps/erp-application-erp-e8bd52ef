'use client';

import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AlertBanner({ type = 'info', message }) {
  const config = {
    info: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50 text-blue-800'
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-800'
    },
    error: {
      icon: XCircle,
      className: 'border-red-200 bg-red-50 text-red-800'
    },
    success: {
      icon: CheckCircle,
      className: 'border-green-200 bg-green-50 text-green-800'
    }
  };

  const { icon: Icon, className } = config[type];

  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}