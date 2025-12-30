/**
 * @swagger
 * /api/customers/{id}/transactions:
 *   post:
 *     summary: Record customer transaction
 *     tags: [Customers]
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
 *               - amount
 *             properties:
 *               transaction_type:
 *                 type: string
 *                 enum: [sale, payment, credit_note]
 *               amount:
 *                 type: number
 *               reference_number:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction recorded successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { transaction } from '@/lib/db';
import { validatePositiveNumber, validateRequired, sanitizeInput } from '@/lib/validation';
import { logCustomerTransactionAction } from '@/lib/audit';
import { hasPermission, PERMISSIONS, canAccessCustomer } from '@/lib/permissions';

export async function POST(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.CUSTOMER_TRANSACTION)) {
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

    const validTypes = ['sale', 'payment', 'credit_note'];
    if (!validTypes.includes(body.transaction_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    const amountValidation = validatePositiveNumber(body.amount, 'Amount');
    if (!amountValidation.valid) {
      return NextResponse.json(
        { success: false, error: amountValidation.error },
        { status: 400 }
      );
    }

    const amount = parseFloat(body.amount);
    if (amount === 0) {
      return NextResponse.json(
        { success: false, error: 'Amount cannot be zero' },
        { status: 400 }
      );
    }

    const result = await transaction(async (client) => {
      // Get current customer
      const customerResult = await client.query(
        'SELECT * FROM customers WHERE id = $1',
        [id]
      );

      if (customerResult.rows.length === 0) {
        throw new Error('Customer not found');
      }

      const customer = customerResult.rows[0];

      // Check access permission
      if (!canAccessCustomer(user.role, user.id, customer)) {
        throw new Error('Access denied');
      }

      let newBalance = parseFloat(customer.current_balance || 0);

      // Calculate new balance based on transaction type
      if (body.transaction_type === 'sale') {
        newBalance += amount;
      } else if (body.transaction_type === 'payment') {
        newBalance -= amount;
      } else if (body.transaction_type === 'credit_note') {
        newBalance -= amount;
      }

      // Update customer balance
      await client.query(
        'UPDATE customers SET current_balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, id]
      );

      // Create customer transaction
      const transactionResult = await client.query(
        `INSERT INTO customer_transactions
         (customer_id, transaction_type, amount, transaction_date, reference_number, notes, created_by, created_at)
         VALUES ($1, $2, $3, NOW(), $4, $5, $6, NOW())
         RETURNING *`,
        [
          id,
          body.transaction_type,
          amount,
          sanitizeInput(body.reference_number || ''),
          sanitizeInput(body.notes || ''),
          user.id
        ]
      );

      return {
        transaction: transactionResult.rows[0],
        newBalance
      };
    });

    // Log audit trail
    await logCustomerTransactionAction(user.id, 'TRANSACTION', result.transaction.id, result.transaction, request);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Transaction recorded successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/customers/[id]/transactions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record transaction' },
      { status: 500 }
    );
  }
}