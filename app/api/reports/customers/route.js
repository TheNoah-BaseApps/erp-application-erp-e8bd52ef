/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Generate customer report
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
 *         description: Customer report generated successfully
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
      whereConditions.push('ct.transaction_date BETWEEN $1 AND $2');
    }

    // Sales rep can only see their customers
    if (user.role === 'sales_rep') {
      const paramIndex = params.length + 1;
      whereConditions.push(`c.sales_rep = $${paramIndex}`);
      params.push(user.id);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = await query(
      `SELECT 
        ct.*,
        c.customer_name,
        c.customer_code,
        c.city_or_district,
        c.country,
        c.current_balance,
        c.balance_risk_limit,
        c.payment_terms_limit,
        s.name as sales_rep_name,
        u.name as created_by_name
       FROM customer_transactions ct
       LEFT JOIN customers c ON ct.customer_id = c.id
       LEFT JOIN users s ON c.sales_rep = s.id
       LEFT JOIN users u ON ct.created_by = u.id
       ${whereClause}
       ORDER BY ct.transaction_date DESC`,
      params
    );

    // Calculate summary statistics
    const summary = result.rows.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.transaction_type === 'sale') {
        acc.totalSales += amount;
      } else if (transaction.transaction_type === 'payment') {
        acc.totalPayments += amount;
      } else if (transaction.transaction_type === 'credit_note') {
        acc.totalCreditNotes += amount;
      }
      return acc;
    }, { totalSales: 0, totalPayments: 0, totalCreditNotes: 0 });

    return NextResponse.json(
      {
        success: true,
        data: {
          transactions: result.rows,
          summary: {
            totalTransactions: result.rows.length,
            totalSales: summary.totalSales,
            totalPayments: summary.totalPayments,
            totalCreditNotes: summary.totalCreditNotes,
            netOutstanding: summary.totalSales - summary.totalPayments - summary.totalCreditNotes
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/reports/customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate customer report' },
      { status: 500 }
    );
  }
}