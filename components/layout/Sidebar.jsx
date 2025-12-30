'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Archive, 
  Receipt, 
  FileText,
  AlertTriangle,
  ClipboardList,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar({ user, isOpen, onClose }) {
  const pathname = usePathname();

  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      href: '/dashboard',
      roles: ['admin', 'manager', 'sales_rep', 'viewer']
    },
    { 
      label: 'Products', 
      icon: Package, 
      href: '/products',
      roles: ['admin', 'manager', 'sales_rep', 'viewer']
    },
    { 
      label: 'Customers', 
      icon: Users, 
      href: '/customers',
      roles: ['admin', 'manager', 'sales_rep', 'viewer']
    },
    { 
      label: 'Inventory', 
      icon: Archive, 
      href: '/inventory',
      roles: ['admin', 'manager', 'sales_rep', 'viewer']
    },
    { 
      label: 'Transactions', 
      icon: Receipt, 
      href: '/transactions',
      roles: ['admin', 'manager', 'sales_rep', 'viewer']
    },
    { 
      label: 'Reports', 
      icon: FileText, 
      href: '/reports',
      roles: ['admin', 'manager', 'sales_rep', 'viewer']
    },
    { 
      label: 'Low Stock Alerts', 
      icon: AlertTriangle, 
      href: '/alerts/low-stock',
      roles: ['admin', 'manager', 'viewer']
    },
    { 
      label: 'At-Risk Customers', 
      icon: AlertTriangle, 
      href: '/alerts/at-risk-customers',
      roles: ['admin', 'manager', 'sales_rep']
    },
    { 
      label: 'Audit Logs', 
      icon: ClipboardList, 
      href: '/audit-logs',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}