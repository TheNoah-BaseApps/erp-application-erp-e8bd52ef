export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES_REP: 'sales_rep',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // Product permissions
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_STOCK_ADJUST: 'product:stock:adjust',
  
  // Customer permissions
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  CUSTOMER_TRANSACTION: 'customer:transaction',
  
  // Report permissions
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  
  // Audit permissions
  AUDIT_VIEW: 'audit:view'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.PRODUCT_STOCK_ADJUST,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.CUSTOMER_TRANSACTION,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.AUDIT_VIEW
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_STOCK_ADJUST,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_TRANSACTION,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT
  ],
  [ROLES.SALES_REP]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_TRANSACTION,
    PERMISSIONS.REPORT_VIEW
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.REPORT_VIEW
  ]
};

export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  
  return permissions.includes(permission);
}

export function canAccessCustomer(userRole, userId, customer) {
  if (!userRole || !customer) return false;
  
  // Admin and Manager can access all customers
  if (userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) {
    return true;
  }
  
  // Sales rep can access their assigned customers
  if (userRole === ROLES.SALES_REP) {
    return customer.sales_rep === userId;
  }
  
  // Viewer can view but not modify
  if (userRole === ROLES.VIEWER) {
    return true;
  }
  
  return false;
}