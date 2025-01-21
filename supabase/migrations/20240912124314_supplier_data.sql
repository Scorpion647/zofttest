CREATE TABLE public.supplier_data (
  supplier_data_id UUID DEFAULT gen_random_uuid (),
  base_bill_id UUID NOT NULL,
  bill_number VARCHAR(50) NOT NULL,
  trm DECIMAL NOT NULL,
  billed_quantity positive_float NOT NULL,
  billed_unit_price BIGINT NOT NULL CHECK (billed_unit_price >= 0),
  billed_total_price BIGINT NOT NULL CHECK (billed_total_price >= 0),
  billed_currency public.currency NOT NULL,
  gross_weight DECIMAL NOT NULL CHECK (gross_weight >= 0),
  packages DECIMAL NOT NULL CHECK (packages >= 0),
  created_by UUID,
  invoice_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (supplier_data_id),
  FOREIGN key (invoice_id) REFERENCES public.invoice_data (invoice_id) ON UPDATE cascade ON DELETE cascade,
  FOREIGN key (base_bill_id) REFERENCES public.base_bills (base_bill_id) ON DELETE cascade ON UPDATE cascade,
  FOREIGN key (created_by) REFERENCES public.profiles (profile_id) ON DELETE SET NULL ON UPDATE cascade
);


CREATE FUNCTION supplier_data_search (public.supplier_data) returns TEXT AS $$
  select
              $1.bill_number || ' '
             || $1.gross_weight || ' '
             || $1.packages || ' '
             || $1.created_by || ' '
             || $1.invoice_id || ' '
             || $1.created_at || ' '
             || $1.modified_at
$$ language sql immutable;


INSERT INTO
  access.table_names (name)
VALUES
  ('supplier_data');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('supplier_data', 'administrator', B'1111');
