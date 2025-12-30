export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  return { valid: true };
}

export function validatePositiveNumber(value, fieldName = 'Value') {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  
  if (num < 0) {
    return { valid: false, error: `${fieldName} must be positive` };
  }
  
  return { valid: true };
}

export function validateInteger(value, fieldName = 'Value') {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const num = Number(value);
  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }
  
  return { valid: true };
}

export function validateRequired(value, fieldName = 'Field') {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  return { valid: true };
}

export function validateProductData(data) {
  const errors = {};

  const nameValidation = validateRequired(data.product_name, 'Product name');
  if (!nameValidation.valid) errors.product_name = nameValidation.error;

  const categoryValidation = validateRequired(data.product_category, 'Product category');
  if (!categoryValidation.valid) errors.product_category = categoryValidation.error;

  const unitValidation = validateRequired(data.unit, 'Unit');
  if (!unitValidation.valid) errors.unit = unitValidation.error;

  if (data.critical_stock_level !== undefined) {
    const stockValidation = validateInteger(data.critical_stock_level, 'Critical stock level');
    if (!stockValidation.valid) errors.critical_stock_level = stockValidation.error;
  }

  if (data.unit_cost !== undefined) {
    const costValidation = validatePositiveNumber(data.unit_cost, 'Unit cost');
    if (!costValidation.valid) errors.unit_cost = costValidation.error;
  }

  if (data.selling_price !== undefined) {
    const priceValidation = validatePositiveNumber(data.selling_price, 'Selling price');
    if (!priceValidation.valid) errors.selling_price = priceValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateCustomerData(data) {
  const errors = {};

  const nameValidation = validateRequired(data.customer_name, 'Customer name');
  if (!nameValidation.valid) errors.customer_name = nameValidation.error;

  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.valid) errors.email = emailValidation.error;
  }

  if (data.telephone_number) {
    const phoneValidation = validatePhone(data.telephone_number);
    if (!phoneValidation.valid) errors.telephone_number = phoneValidation.error;
  }

  if (data.payment_terms_limit !== undefined) {
    const termsValidation = validateInteger(data.payment_terms_limit, 'Payment terms limit');
    if (!termsValidation.valid) errors.payment_terms_limit = termsValidation.error;
  }

  if (data.balance_risk_limit !== undefined) {
    const riskValidation = validatePositiveNumber(data.balance_risk_limit, 'Balance risk limit');
    if (!riskValidation.valid) errors.balance_risk_limit = riskValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}