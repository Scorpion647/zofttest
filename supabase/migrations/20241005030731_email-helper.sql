CREATE
OR REPLACE function get_invoice_email (invoice_id UUID) returns TABLE (
  email VARCHAR(255),
  invoice_id UUID,
  invoice_updated_at TIMESTAMP WITH TIME ZONE,
  supplier_name VARCHAR(255),
  bill_number VARCHAR(50),
  purchase_order VARCHAR(50)
) AS $$
    select
        profile.email as email,
        invoice.invoice_id as invoice_id,
        invoice.updated_at as invoice_updated_at,
        supplier.name as supplier_name,
        supplier_data.bill_number as bill_number,
        bill.purchase_order
    from
        public.invoice_data invoice
        inner join public.suppliers supplier on invoice.supplier_id = supplier.supplier_id
        inner join public.profiles profile on invoice.last_modified_by = profile.profile_id
        inner join (
            select * from public.supplier_data d where d.invoice_id = $1 limit 1
        ) supplier_data on invoice.invoice_id = supplier_data.invoice_id
        inner join public.base_bills bill on supplier_data.base_bill_id = bill.base_bill_id
        where invoice.invoice_id = $1 limit 1;
$$ language sql stable;
