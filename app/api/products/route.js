/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
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
 *         description: Products retrieved successfully
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *         description: Product created successfully
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { validateProductData, sanitizeInput } from '@/lib/validation';
import { generateProductCode } from '@/lib/utils';
import { logProductAction } from '@/lib/audit';
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let whereConditions = ['status = $1'];
    let params = [status];
    let paramCount = 1;

    if (search) {
      paramCount++;
      whereConditions.push(`(product_name ILIKE $${paramCount} OR product_code ILIKE $${paramCount} OR brand ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      whereConditions.push(`product_category = $${paramCount}`);
      params.push(category);
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await query(
      `SELECT COUNT(*) FROM products WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT p.*, u.name as created_by_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          products: result.rows,
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
    console.error('Error in GET /api/products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(request);

    if (!hasPermission(user.role, PERMISSIONS.PRODUCT_CREATE)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();

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

    // Generate product code if not provided
    let productCode = body.product_code;
    if (!productCode) {
      productCode = await generateProductCode();
    } else {
      productCode = sanitizeInput(productCode);
      
      // Check if code already exists
      const existingCode = await query(
        'SELECT id FROM products WHERE product_code = $1',
        [productCode]
      );
      
      if (existingCode.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Product code already exists' },
          { status: 409 }
        );
      }
    }

    const result = await transaction(async (client) => {
      const productResult = await client.query(
        `INSERT INTO products 
         (product_name, product_code, product_category, unit, critical_stock_level, 
          brand, current_stock, unit_cost, selling_price, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          productName,
          productCode,
          productCategory,
          unit,
          body.critical_stock_level || 0,
          brand,
          body.current_stock || 0,
          body.unit_cost || 0,
          body.selling_price || 0,
          'active',
          user.id
        ]
      );

      return productResult.rows[0];
    });

    // Log audit trail
    await logProductAction(user.id, 'CREATE', result.id, null, result, request);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Product created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}