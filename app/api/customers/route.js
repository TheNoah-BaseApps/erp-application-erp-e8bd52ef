/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers with filters
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Customer created successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { validateCustomerData, sanitizeInput } from '@/lib/validation';
import { generateCustomerCode } from '@/lib/utils';
import { logCustomerAction } from '@/lib/audit';
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let whereConditions = ['c.status = $1'];
    let params = [status];
    let paramCount = 1;

    if (search) {
      paramCount++;
      whereConditions.push(`(c.customer_name ILIKE $${paramCount} OR c.customer_code ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    // Sales rep can only see their assigned customers
    if (user.role === 'sales_rep') {
      paramCount++;
      whereConditions.push(`c.sales_rep = $${paramCount}`);
      params.push(user.id);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(
      `SELECT COUNT(*) FROM customers c WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT c.*, u.name as created_by_name, s.name as sales_rep_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN users s ON c.sales_rep = s.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          customers: result.rows,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.CUSTOMER_CREATE)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

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

    // Generate customer code if not provided
    let customerCode = body.customer_code;
    if (!customerCode) {
      customerCode = await generateCustomerCode();
    } else {
      customerCode = sanitizeInput(customerCode);
      
      // Check if code already exists
      const existingCode = await query(
        'SELECT id FROM customers WHERE customer_code = $1',
        [customerCode]
      );
      
      if (existingCode.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Customer code already exists' },
          { status: 409 }
        );
      }
    }

    const result = await transaction(async (client) => {
      const customerResult = await client.query(
        `INSERT INTO customers 
         (customer_name, customer_code, address, city_or_district, sales_rep, country, 
          region_or_state, telephone_number, email, contact_person, payment_terms_limit, 
          balance_risk_limit, current_balance, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
         RETURNING *`,
        [
          customerName,
          customerCode,
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
          0,
          'active',
          user.id
        ]
      );

      return customerResult.rows[0];
    });

    // Log audit trail
    await logCustomerAction(user.id, 'CREATE', result.id, null, result, request);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Customer created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}