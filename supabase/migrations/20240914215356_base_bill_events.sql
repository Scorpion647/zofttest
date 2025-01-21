ALTER TABLE public.base_bills enable ROW level security;


CREATE POLICY "select for base bills" ON public.base_bills FOR
SELECT
  TO authenticated USING (
    public.role_has_permission ('base_bills', B'0001')
    OR is_employee (public.base_bills.supplier_id, auth.uid ())
  );


CREATE POLICY "insert for base bills" ON public.base_bills FOR insert TO authenticated
WITH
  CHECK (
    public.role_has_permission ('base_bills', B'0010')
  );


CREATE POLICY "update for base bills" ON public.base_bills
FOR UPDATE
  TO authenticated USING (
    public.role_has_permission ('base_bills', B'0100')
  );


CREATE POLICY "delete for base bills" ON public.base_bills FOR delete TO authenticated USING (
  public.role_has_permission ('base_bills', B'1000')
);


CREATE
OR REPLACE function public.before_base_bill_update () returns trigger AS $$
begin
  if new.approved_quantity + new.pending_quantity > new.total_quantity then
      raise invalid_parameter_value using message='The given quantity exceeds the real quantity. You should increase the total quantity available or decrease the given quantity';
  end if;
  return new;
end
$$ language plpgsql security definer;


CREATE TRIGGER before_update_base_bill before
UPDATE ON public.base_bills FOR each ROW
EXECUTE procedure public.before_base_bill_update ();
