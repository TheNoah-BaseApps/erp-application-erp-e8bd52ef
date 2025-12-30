/**
 * @swagger
 * /api/reports/inventory:
 *   get:
 *     summary: Generate inventory report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory report generated successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.REPORT_VIEW)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let whereConditions = [];
    let params = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      whereConditions.push('it.transaction_date BETWEEN $1 AND $2');
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = await query(
      `SELECT 
        it.*,
        p.product_name,
        p.product_code,
        p.product_category,
        p.brand,
        p.unit,
        p.current_stock,
        p.critical_stock_level,
        u.name as created_by_name
       FROM inventory_transactions it
       LEFT JOIN products p ON it.product_id = p.id
       LEFT JOIN users u ON it.created_by = u.id
       ${whereClause}
       ORDER BY it.transaction_date DESC`,
      params
    );

    // Calculate summary statistics
    const summary = result.rows.reduce((acc, transaction) => {
      if (transaction.transaction_type === 'stock_in') {
        acc.totalStockIn += Math.abs(transaction.quantity);
      } else if (transaction.transaction_type === 'stock_out') {
        acc.totalStockOut += Math.abs(transaction.quantity);
      }
      return acc;
    }, { totalStockIn: 0, totalStockOut: 0 });

    return NextResponse.json(
      {
        success: true,
        data: {
          transactions: result.rows,
          summary: {
            totalTransactions: result.rows.length,
            totalStockIn: summary.totalStockIn,
            totalStockOut: summary.totalStockOut,
            netChange: summary.totalStockIn - summary.totalStockOut
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/reports/inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate inventory report' },
      { status: 500 }
    );
  }
}