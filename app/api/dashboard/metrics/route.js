/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const user = await requireAuth(request);

    // Get product metrics
    const productMetrics = await query(
      `SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE status = 'active') as active_products,
        COUNT(*) FILTER (WHERE current_stock <= critical_stock_level) as low_stock_products
       FROM products`,
      []
    );

    // Get customer metrics
    let customerQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(*) FILTER (WHERE status = 'active') as active_customers,
        COUNT(*) FILTER (WHERE current_balance >= balance_risk_limit) as at_risk_customers,
        SUM(current_balance) as total_outstanding_balance
      FROM customers
    `;

    const customerParams = [];
    if (user.role === 'sales_rep') {
      customerQuery += ' WHERE sales_rep = $1';
      customerParams.push(user.id);
    }

    const customerMetrics = await query(customerQuery, customerParams);

    // Get recent inventory transactions
    const recentInventory = await query(
      `SELECT it.*, p.product_name, p.product_code, u.name as created_by_name
       FROM inventory_transactions it
       LEFT JOIN products p ON it.product_id = p.id
       LEFT JOIN users u ON it.created_by = u.id
       ORDER BY it.created_at DESC
       LIMIT 5`,
      []
    );

    // Get recent customer transactions
    let customerTxQuery = `
      SELECT ct.*, c.customer_name, c.customer_code, u.name as created_by_name
      FROM customer_transactions ct
      LEFT JOIN customers c ON ct.customer_id = c.id
      LEFT JOIN users u ON ct.created_by = u.id
    `;

    const customerTxParams = [];
    if (user.role === 'sales_rep') {
      customerTxQuery += ' WHERE c.sales_rep = $1';
      customerTxParams.push(user.id);
    }

    customerTxQuery += ' ORDER BY ct.created_at DESC LIMIT 5';

    const recentCustomerTx = await query(customerTxQuery, customerTxParams);

    // Calculate total inventory value
    const inventoryValue = await query(
      `SELECT SUM(current_stock * unit_cost) as total_inventory_value
       FROM products
       WHERE status = 'active'`,
      []
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          products: {
            total: parseInt(productMetrics.rows[0].total_products),
            active: parseInt(productMetrics.rows[0].active_products),
            lowStock: parseInt(productMetrics.rows[0].low_stock_products)
          },
          customers: {
            total: parseInt(customerMetrics.rows[0].total_customers),
            active: parseInt(customerMetrics.rows[0].active_customers),
            atRisk: parseInt(customerMetrics.rows[0].at_risk_customers),
            totalOutstanding: parseFloat(customerMetrics.rows[0].total_outstanding_balance || 0)
          },
          inventory: {
            totalValue: parseFloat(inventoryValue.rows[0].total_inventory_value || 0)
          },
          recentActivity: {
            inventoryTransactions: recentInventory.rows,
            customerTransactions: recentCustomerTx.rows
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/dashboard/metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}