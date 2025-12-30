/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get products with low stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.PRODUCT_READ)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const result = await query(
      `SELECT p.*, u.name as created_by_name,
              (p.critical_stock_level - p.current_stock) as stock_deficit
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.status = 'active' 
       AND p.current_stock <= p.critical_stock_level
       ORDER BY stock_deficit DESC`,
      []
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          products: result.rows,
          count: result.rows.length
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/products/low-stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}