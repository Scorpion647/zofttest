ALTER TABLE public.invoice_data enable ROW level security;


INSERT INTO
  access.table_names (name)
VALUES
  ('invoice_data');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('invoice_data', 'administrator', B'1111');


CREATE POLICY "select for invoice data" ON public.invoice_data FOR
SELECT
  USING (
    public.role_has_permission ('invoice_data', B'0001')
    OR is_employee (supplier_id, auth.uid ())
  );


CREATE POLICY "insert for invoice data" ON public.invoice_data FOR insert
WITH
  CHECK (
    public.role_has_permission ('invoice_data', B'0010')
    OR is_employee (supplier_id, auth.uid ())
  );


CREATE POLICY "update for invoice data" ON public.invoice_data
FOR UPDATE
  USING (
    public.role_has_permission ('invoice_data', B'0100')
    OR is_employee (supplier_id, auth.uid ())
  );


CREATE POLICY "delete for invoice data" ON public.invoice_data FOR delete USING (
  public.role_has_permission ('invoice_data', B'1000')
  OR is_employee (supplier_id, auth.uid ())
);
