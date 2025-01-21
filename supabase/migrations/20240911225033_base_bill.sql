CREATE TYPE public.material_type AS ENUM('national', 'foreign', 'nationalized', 'other');


CREATE TABLE IF NOT EXISTS public.materials (
  material_code VARCHAR(255),
  subheading VARCHAR(10) CHECK (
    subheading ~ '^(N-)?[a-zA-Z0-9]{10}$'
    OR subheading IS NULL
  ),
  type public.material_type,
  measurement_unit VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (material_code)
);


CREATE FUNCTION material_search (public.materials) returns TEXT AS $$
  select $1.material_code || ' '
                    || $1.subheading || ' '
                    || $1.type || ' '
                    || $1.measurement_unit || ' '
                    || $1.created_at;
$$ language sql immutable;


INSERT INTO
  access.table_names (name)
VALUES
  ('materials');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('materials', 'administrator', B'1111');


CREATE TYPE public.currency AS ENUM('COP', 'USD', 'EUR');


CREATE FUNCTION is_positive_value (float8) returns BOOLEAN AS $$ begin
    if ($1 < 0) then
        raise exception 'Value must be positive. Value: %', $1;
    end if;

    return true;
end; $$ language plpgsql;


CREATE DOMAIN positive_float AS DECIMAL(20, 8) CHECK (is_positive_value (value));


CREATE DOMAIN positive_integer AS INTEGER CHECK (is_positive_value (value::float4));


CREATE TABLE public.base_bills (
  base_bill_id UUID DEFAULT gen_random_uuid () NOT NULL,
  item positive_integer NOT NULL,
  approved_quantity positive_float NOT NULL DEFAULT 0,
  pending_quantity positive_float NOT NULL DEFAULT 0,
  total_quantity positive_float NOT NULL DEFAULT 0,
  material_code VARCHAR(255) NOT NULL,
  purchase_order VARCHAR(50) NOT NULL,
  measurement_unit VARCHAR(50) NOT NULL,
  unit_price BIGINT NOT NULL,
  currency public.currency NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  supplier_id INTEGER NOT NULL,
  description VARCHAR(50),
  net_price BIGINT,
  PRIMARY KEY (base_bill_id),
  FOREIGN key (supplier_id) REFERENCES public.suppliers (supplier_id) ON DELETE cascade ON UPDATE cascade,
  UNIQUE (base_bill_id, purchase_order)
);


CREATE FUNCTION base_bill_search (public.base_bills) returns TEXT AS $$
  select $1.base_bill_id || ' '
             || $1.item || ' '
             || $1.material_code || ' '
             || $1.purchase_order || ' '
             || $1.measurement_unit || ' '
             || $1.currency || ' '
             || $1.description || ' '
             || $1.created_at;
$$ language sql immutable;


INSERT INTO
  access.table_names (name)
VALUES
  ('base_bills');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('base_bills', 'administrator', B'1111');
