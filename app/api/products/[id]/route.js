/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated successfully
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { validateProductData, sanitizeInput } from '@/lib/validation';
import { logProductAction } from '@/lib/audit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.PRODUCT_READ)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    const result = await query(
      `SELECT p.*, u.name as created_by_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get recent inventory transactions
    const transactionsResult = await query(
      `SELECT it.*, u.name as created_by_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.created_by = u.id
       WHERE it.product_id = $1
       ORDER BY it.transaction_date DESC
       LIMIT 10`,
      [id]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          product: result.rows[0],
          recentTransactions: transactionsResult.rows
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.PRODUCT_UPDATE)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Get existing product
    const existingResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const existingProduct = existingResult.rows[0];

    // Validate product data
    const validation = validateProductData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const productName = sanitizeInput(body.product_name);
    const productCategory = sanitizeInput(body.product_category);
    const unit = sanitizeInput(body.unit);
    const brand = sanitizeInput(body.brand || '');

    const result = await query(
      `UPDATE products
       SET product_name = $1, product_category = $2, unit = $3, 
           critical_stock_level = $4, brand = $5, unit_cost = $6, 
           selling_price = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        productName,
        productCategory,
        unit,
        body.critical_stock_level || 0,
        brand,
        body.unit_cost || 0,
        body.selling_price || 0,
        id
      ]
    );

    // Log audit trail
    await logProductAction(user.id, 'UPDATE', id, existingProduct, result.rows[0], request);

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'Product updated successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.PRODUCT_DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get existing product
    const existingResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const existingProduct = existingResult.rows[0];

    // Soft delete
    await query(
      'UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2',
      ['inactive', id]
    );

    // Log audit trail
    await logProductAction(user.id, 'DELETE', id, existingProduct, null, request);

    return NextResponse.json(
      {
        success: true,
        message: 'Product deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/products/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}