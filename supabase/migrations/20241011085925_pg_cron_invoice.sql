CREATE EXTENSION if NOT EXISTS pg_cron;

CREATE OR REPLACE PROCEDURE delete_empty_invoices () AS $$
begin
    delete from public.invoice_data invoice where (select count(*) from public.supplier_data sd where sd.invoice_id = invoice.invoice_id) = 0;
end;
$$ language plpgsql;

SELECT
  cron.schedule (
    'delete_empty_invoices',
    '0 0 * * *',
    'CALL delete_empty_invoices()'
  );
