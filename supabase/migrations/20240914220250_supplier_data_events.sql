ALTER TABLE public.supplier_data enable ROW level security;

CREATE POLICY "can select supplier data" ON public.supplier_data FOR
SELECT
  USING (
    public.role_has_permission ('supplier_data', B'0001')
    OR EXISTS (
      SELECT
        1
      FROM
        public.base_bills
      WHERE
        base_bills.base_bill_id = supplier_data.base_bill_id
    )
  );

CREATE POLICY "can insert supplier data" ON public.supplier_data FOR insert
WITH
  CHECK (
    public.role_has_permission ('supplier_data', B'0010')
    OR EXISTS (
      SELECT
        1
      FROM
        public.base_bills
      WHERE
        base_bills.base_bill_id = supplier_data.base_bill_id
    )
  );

CREATE POLICY "can update supplier data" ON public.supplier_data
FOR UPDATE
  USING (
    public.role_has_permission ('supplier_data', B'0100')
    OR EXISTS (
      SELECT
        1
      FROM
        public.base_bills
      WHERE
        base_bills.base_bill_id = supplier_data.base_bill_id
    )
  );

CREATE POLICY "can delete supplier data" ON public.supplier_data FOR delete USING (
  public.role_has_permission ('supplier_data', B'1000')
  OR EXISTS (
    SELECT
      1
    FROM
      public.base_bills
    WHERE
      base_bills.base_bill_id = supplier_data.base_bill_id
  )
);

CREATE OR REPLACE FUNCTION public.validate_supplier_data () returns trigger AS $$
declare
    _base_bill public.base_bills%rowtype;
    _invoice public.invoice_data%rowtype;
begin
    select * into _base_bill from public.base_bills where base_bill_id = new.base_bill_id;
    select * into _invoice from public.invoice_data where invoice_id = new.invoice_id;

    if (_invoice is null) then
        raise insufficient_privilege using message =
                'The selected invoice does not exist or you do not have enough privileges to access it';
    end if;

    if (_base_bill is null) then
        raise insufficient_privilege using message =
                'The selected base bill does not exist or you do not have enough privileges to access it';
    end if;

    if (_base_bill.supplier_id <> _invoice.supplier_id) then
        raise insufficient_privilege using message =
                'The base bill and the invoice do not belong to the same supplier';
    end if;

    return new;
end
$$ language plpgsql security invoker;

CREATE TRIGGER "before insert supplier data" before insert ON public.supplier_data FOR each ROW
EXECUTE procedure public.validate_supplier_data ();

CREATE TRIGGER "before update supplier data" before
UPDATE ON public.supplier_data FOR each ROW
EXECUTE procedure public.validate_supplier_data ();
