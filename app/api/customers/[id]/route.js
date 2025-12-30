/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 *   put:
 *     summary: Update customer
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
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
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
 *         description: Customer deleted successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { validateCustomerData, sanitizeInput } from '@/lib/validation';
import { logCustomerAction } from '@/lib/audit';
import { hasPermission, PERMISSIONS, canAccessCustomer } from '@/lib/permissions';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.CUSTOMER_READ)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    const result = await query(
      `SELECT c.*, u.name as created_by_name, s.name as sales_rep_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN users s ON c.sales_rep = s.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = result.rows[0];

    // Check access permission
    if (!canAccessCustomer(user.role, user.id, customer)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get recent transactions
    const transactionsResult = await query(
      `SELECT ct.*, u.name as created_by_name
       FROM customer_transactions ct
       LEFT JOIN users u ON ct.created_by = u.id
       WHERE ct.customer_id = $1
       ORDER BY ct.transaction_date DESC
       LIMIT 10`,
      [id]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          customer,
          recentTransactions: transactionsResult.rows
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/customers/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.CUSTOMER_UPDATE)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Get existing customer
    const existingResult = await query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const existingCustomer = existingResult.rows[0];

    // Check access permission
    if (!canAccessCustomer(user.role, user.id, existingCustomer)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate customer data
    const validation = validateCustomerData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const customerName = sanitizeInput(body.customer_name);
    const address = sanitizeInput(body.address || '');
    const city = sanitizeInput(body.city_or_district || '');
    const country = sanitizeInput(body.country || '');
    const region = sanitizeInput(body.region_or_state || '');
    const contactPerson = sanitizeInput(body.contact_person || '');

    const result = await query(
      `UPDATE customers
       SET customer_name = $1, address = $2, city_or_district = $3, 
           sales_rep = $4, country = $5, region_or_state = $6,
           telephone_number = $7, email = $8, contact_person = $9,
           payment_terms_limit = $10, balance_risk_limit = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        customerName,
        address,
        city,
        body.sales_rep || null,
        country,
        region,
        body.telephone_number || '',
        body.email || '',
        contactPerson,
        body.payment_terms_limit || 0,
        body.balance_risk_limit || 0,
        id
      ]
    );

    // Log audit trail
    await logCustomerAction(user.id, 'UPDATE', id, existingCustomer, result.rows[0], request);

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'Customer updated successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/customers/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.CUSTOMER_DELETE)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get existing customer
    const existingResult = await query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const existingCustomer = existingResult.rows[0];

    // Soft delete
    await query(
      'UPDATE customers SET status = $1, updated_at = NOW() WHERE id = $2',
      ['inactive', id]
    );

    // Log audit trail
    await logCustomerAction(user.id, 'DELETE', id, existingCustomer, null, request);

    return NextResponse.json(
      {
        success: true,
        message: 'Customer deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/customers/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}