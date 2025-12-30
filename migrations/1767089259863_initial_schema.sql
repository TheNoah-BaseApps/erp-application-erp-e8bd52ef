CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'viewer' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  product_name text NOT NULL,
  product_code text NOT NULL UNIQUE,
  product_category text,
  unit text NOT NULL,
  critical_stock_level integer DEFAULT 0 NOT NULL,
  brand text,
  current_stock integer DEFAULT 0 NOT NULL,
  unit_cost decimal(15,2),
  selling_price decimal(15,2),
  status text DEFAULT 'active' NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_code ON products (product_code);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (product_category);

CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  customer_name text NOT NULL,
  customer_code text NOT NULL UNIQUE,
  address text,
  city_or_district text,
  sales_rep uuid,
  country text,
  region_or_state text,
  telephone_number text,
  email text,
  contact_person text,
  payment_terms_limit integer DEFAULT 30 NOT NULL,
  balance_risk_limit decimal(15,2) DEFAULT 0 NOT NULL,
  current_balance decimal(15,2) DEFAULT 0 NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers (customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_sales_rep ON customers (sales_rep);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  product_id uuid NOT NULL,
  transaction_type text NOT NULL,
  quantity integer NOT NULL,
  transaction_date timestamp with time zone NOT NULL,
  reference_number text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions (transaction_date);

CREATE TABLE IF NOT EXISTS customer_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  customer_id uuid NOT NULL,
  transaction_type text NOT NULL,
  amount decimal(15,2) NOT NULL,
  transaction_date timestamp with time zone NOT NULL,
  reference_number text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer ON customer_transactions (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_date ON customer_transactions (transaction_date);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);