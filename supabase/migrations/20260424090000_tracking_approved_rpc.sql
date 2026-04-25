CREATE OR REPLACE FUNCTION public.tracking_approved_summary (
  p_supplier_id INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 40,
  p_offset INTEGER DEFAULT 0
) returns TABLE (
  invoice_id TEXT,
  purchase_order TEXT,
  bill_number TEXT,
  subtotal NUMERIC,
  fob NUMERIC,
  modified_at TIMESTAMPTZ,
  supplier_name TEXT
) language sql stable AS $$
  with invoice_agg as (
    select
      i.invoice_id,
      i.supplier_id,
      s.name as supplier_name,
      min(sd.modified_at) as modified_at,
      min(sd.bill_number) as bill_number,
      sum((sd.billed_unit_price::numeric / 100) * sd.billed_quantity::numeric) as subtotal,
      sum(
        (
          (sd.billed_unit_price::numeric / 100) * sd.billed_quantity::numeric
        ) / nullif(case when sd.billed_currency = 'USD' then 1 else sd.trm end::numeric, 0)
      ) as fob
    from invoice_data i
    join suppliers s on s.supplier_id = i.supplier_id
    join supplier_data sd on sd.invoice_id = i.invoice_id
    where i.state = 'approved'
      and (p_supplier_id is null or i.supplier_id = p_supplier_id)
    group by i.invoice_id, i.supplier_id, s.name
  ),
  first_bill as (
    select distinct on (sd.invoice_id)
      sd.invoice_id,
      bb.purchase_order
    from supplier_data sd
    join base_bills bb on bb.base_bill_id = sd.base_bill_id
    order by sd.invoice_id, sd.modified_at asc, sd.base_bill_id asc
  )
  select
    ia.invoice_id,
    fb.purchase_order,
    ia.bill_number,
    round(ia.subtotal, 2) as subtotal,
    round(ia.fob, 2) as fob,
    ia.modified_at,
    ia.supplier_name
  from invoice_agg ia
  left join first_bill fb on fb.invoice_id = ia.invoice_id
  where (p_year is null or extract(year from ia.modified_at)::int = p_year)
    and (p_month is null or extract(month from ia.modified_at)::int = p_month)
  order by ia.modified_at desc
  limit p_limit offset p_offset;
$$;

CREATE OR REPLACE FUNCTION public.tracking_approved_export_rows (
  p_supplier_id INTEGER DEFAULT NULL,
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL
) returns TABLE (
  invoice_id TEXT,
  purchase_order TEXT,
  item INTEGER,
  material_code TEXT,
  description TEXT,
  billed_quantity NUMERIC,
  bill_measurement_unit TEXT,
  supplier_name TEXT,
  billed_unit_price NUMERIC,
  bill_number TEXT,
  fmm TEXT,
  subheading TEXT,
  material_measurement_unit TEXT,
  trm NUMERIC,
  billed_currency TEXT,
  material_type TEXT,
  gross_weight NUMERIC,
  packages INTEGER
) language sql stable AS $$
  select
    i.invoice_id,
    bb.purchase_order,
    bb.item,
    bb.material_code,
    bb.description,
    sd.billed_quantity,
    bb.measurement_unit as bill_measurement_unit,
    s.name as supplier_name,
    sd.billed_unit_price,
    sd.bill_number,
    i.fmm,
    m.subheading,
    m.measurement_unit as material_measurement_unit,
    sd.trm,
    sd.billed_currency::text as billed_currency,
    m.type::text as material_type,
    sd.gross_weight,
    sd.packages
  from invoice_data i
  join suppliers s on s.supplier_id = i.supplier_id
  join supplier_data sd on sd.invoice_id = i.invoice_id
  join base_bills bb on bb.base_bill_id = sd.base_bill_id
  left join materials m on m.material_code = bb.material_code
  where i.state = 'approved'
    and (p_supplier_id is null or i.supplier_id = p_supplier_id)
    and (p_year is null or extract(year from sd.modified_at)::int = p_year)
    and (p_month is null or extract(month from sd.modified_at)::int = p_month)
  order by sd.modified_at desc, i.invoice_id asc;
$$;
