import { query } from './db';

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  changes,
  ipAddress
}) {
  try {
    const result = await query(
      `INSERT INTO audit_logs 
       (user_id, action, entity_type, entity_id, changes, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [userId, action, entityType, entityId, JSON.stringify(changes), ipAddress]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error - audit logging should not break main operations
    return null;
  }
}

export function getClientIp(request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error getting client IP:', error);
    return 'unknown';
  }
}

export async function logProductAction(userId, action, productId, oldData, newData, request) {
  try {
    const changes = {
      old: oldData || null,
      new: newData || null
    };
    
    await createAuditLog({
      userId,
      action,
      entityType: 'product',
      entityId: productId,
      changes,
      ipAddress: getClientIp(request)
    });
  } catch (error) {
    console.error('Error logging product action:', error);
  }
}

export async function logCustomerAction(userId, action, customerId, oldData, newData, request) {
  try {
    const changes = {
      old: oldData || null,
      new: newData || null
    };
    
    await createAuditLog({
      userId,
      action,
      entityType: 'customer',
      entityId: customerId,
      changes,
      ipAddress: getClientIp(request)
    });
  } catch (error) {
    console.error('Error logging customer action:', error);
  }
}

export async function logInventoryAction(userId, action, transactionId, data, request) {
  try {
    const changes = { data };
    
    await createAuditLog({
      userId,
      action,
      entityType: 'inventory_transaction',
      entityId: transactionId,
      changes,
      ipAddress: getClientIp(request)
    });
  } catch (error) {
    console.error('Error logging inventory action:', error);
  }
}

export async function logCustomerTransactionAction(userId, action, transactionId, data, request) {
  try {
    const changes = { data };
    
    await createAuditLog({
      userId,
      action,
      entityType: 'customer_transaction',
      entityId: transactionId,
      changes,
      ipAddress: getClientIp(request)
    });
  } catch (error) {
    console.error('Error logging customer transaction action:', error);
  }
}