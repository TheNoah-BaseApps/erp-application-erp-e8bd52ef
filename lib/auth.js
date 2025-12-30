import { verifyToken, getTokenFromRequest } from './jwt';
import { query } from './db';

export async function authenticate(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return { authenticated: false, error: 'Invalid token' };
    }

    // Verify user still exists in database
    const result = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return { authenticated: false, error: 'User not found' };
    }

    return {
      authenticated: true,
      user: result.rows[0]
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

export async function requireAuth(request) {
  const auth = await authenticate(request);
  
  if (!auth.authenticated) {
    throw new Error(auth.error || 'Unauthorized');
  }
  
  return auth.user;
}

export function hasRole(user, allowedRoles) {
  if (!user || !user.role) {
    return false;
  }
  return allowedRoles.includes(user.role);
}

export function checkPermission(user, resource, action) {
  if (!user || !user.role) {
    return false;
  }

  const permissions = {
    admin: {
      products: ['create', 'read', 'update', 'delete'],
      customers: ['create', 'read', 'update', 'delete'],
      inventory: ['create', 'read', 'update', 'delete'],
      transactions: ['create', 'read', 'update', 'delete'],
      reports: ['read'],
      audit_logs: ['read']
    },
    manager: {
      products: ['create', 'read', 'update'],
      customers: ['create', 'read', 'update'],
      inventory: ['create', 'read', 'update'],
      transactions: ['create', 'read', 'update'],
      reports: ['read'],
      audit_logs: []
    },
    sales_rep: {
      products: ['read'],
      customers: ['create', 'read', 'update'],
      inventory: ['read'],
      transactions: ['create', 'read'],
      reports: ['read'],
      audit_logs: []
    },
    viewer: {
      products: ['read'],
      customers: ['read'],
      inventory: ['read'],
      transactions: ['read'],
      reports: ['read'],
      audit_logs: []
    }
  };

  const rolePermissions = permissions[user.role];
  if (!rolePermissions) {
    return false;
  }

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) {
    return false;
  }

  return resourcePermissions.includes(action);
}