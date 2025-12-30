/**
 * @swagger
 * /api/customers/at-risk:
 *   get:
 *     summary: Get customers exceeding balance risk limit
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: At-risk customers retrieved successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.CUSTOMER_READ)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let queryStr = `
      SELECT c.*, u.name as created_by_name, s.name as sales_rep_name,
             (c.current_balance - c.balance_risk_limit) as over_limit_amount
      FROM customers c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN users s ON c.sales_rep = s.id
      WHERE c.status = 'active' 
      AND c.current_balance >= c.balance_risk_limit
    `;

    const params = [];

    // Sales rep can only see their assigned customers
    if (user.role === 'sales_rep') {
      queryStr += ' AND c.sales_rep = $1';
      params.push(user.id);
    }

    queryStr += ' ORDER BY over_limit_amount DESC';

    const result = await query(queryStr, params);

    return NextResponse.json(
      {
        success: true,
        data: {
          customers: result.rows,
          count: result.rows.length
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/customers/at-risk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch at-risk customers' },
      { status: 500 }
    );
  }
}