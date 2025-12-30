/**
 * @swagger
 * /api/products/{id}/stock:
 *   post:
 *     summary: Adjust product stock
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
 *             required:
 *               - transaction_type
 *               - quantity
 *             properties:
 *               transaction_type:
 *                 type: string
 *                 enum: [stock_in, stock_out, adjustment]
 *               quantity:
 *                 type: integer
 *               reference_number:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { validateInteger, validateRequired, sanitizeInput } from '@/lib/validation';
import { logInventoryAction } from '@/lib/audit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.PRODUCT_STOCK_ADJUST)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate inputs
    const typeValidation = validateRequired(body.transaction_type, 'Transaction type');
    if (!typeValidation.valid) {
      return NextResponse.json(
        { success: false, error: typeValidation.error },
        { status: 400 }
      );
    }

    const validTypes = ['stock_in', 'stock_out', 'adjustment'];
    if (!validTypes.includes(body.transaction_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    const quantityValidation = validateInteger(body.quantity, 'Quantity');
    if (!quantityValidation.valid) {
      return NextResponse.json(
        { success: false, error: quantityValidation.error },
        { status: 400 }
      );
    }

    const quantity = parseInt(body.quantity);
    if (quantity === 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity cannot be zero' },
        { status: 400 }
      );
    }

    const result = await transaction(async (client) => {
      // Get current product
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = productResult.rows[0];
      let newStock = product.current_stock;

      // Calculate new stock based on transaction type
      if (body.transaction_type === 'stock_in') {
        newStock += Math.abs(quantity);
      } else if (body.transaction_type === 'stock_out') {
        newStock -= Math.abs(quantity);
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
      } else if (body.transaction_type === 'adjustment') {
        newStock = Math.abs(quantity);
      }

      // Update product stock
      await client.query(
        'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
        [newStock, id]
      );

      // Create inventory transaction
      const transactionResult = await client.query(
        `INSERT INTO inventory_transactions
         (product_id, transaction_type, quantity, transaction_date, reference_number, notes, created_by, created_at)
         VALUES ($1, $2, $3, NOW(), $4, $5, $6, NOW())
         RETURNING *`,
        [
          id,
          body.transaction_type,
          quantity,
          sanitizeInput(body.reference_number || ''),
          sanitizeInput(body.notes || ''),
          user.id
        ]
      );

      return {
        transaction: transactionResult.rows[0],
        newStock
      };
    });

    // Log audit trail
    await logInventoryAction(user.id, 'STOCK_ADJUSTMENT', result.transaction.id, result.transaction, request);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Stock adjusted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/products/[id]/stock:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}