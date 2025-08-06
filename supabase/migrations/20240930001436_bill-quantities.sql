CREATE FUNCTION public.update_bill_quantities (base_bill_id UUID) returns void AS $$
    begin
        update public.base_bills base
        set approved_quantity = (
            select coalesce(sum(sd.billed_quantity), 0)
            from supplier_data sd
            inner join invoice_data inv using (invoice_id)
            where sd.base_bill_id = base.base_bill_id and inv.state = 'approved'
        ),
        pending_quantity=(
            select coalesce(sum(sd.billed_quantity), 0)
            from supplier_data sd
            inner join invoice_data inv using (invoice_id)
            where sd.base_bill_id = base.base_bill_id and inv.state = 'pending'
        )
        where base.base_bill_id = $1;
    end $$ language plpgsql security definer;

CREATE OR REPLACE FUNCTION public.handle_invoice_state_change () returns trigger AS $$
    declare
        _bill_record record;
begin
    if (old.state <> new.state) then
        for _bill_record in select distinct base_bill_id from public.supplier_data where invoice_id = new.invoice_id loop
            perform public.update_bill_quantities(_bill_record.base_bill_id);
        end loop;
    end if;

    return new;
end;
$$ language plpgsql security definer;

CREATE TRIGGER handle_invoice_state_change
AFTER
UPDATE ON public.invoice_data FOR each ROW
EXECUTE procedure public.handle_invoice_state_change ();

CREATE OR REPLACE FUNCTION public.update_invoice_state_after_supplier_data_delete () returns trigger AS $$
    declare
        invoice invoice_data%rowtype;
begin
    select * into invoice from public.invoice_data where invoice_id = old.invoice_id;

    if (invoice.state = 'approved') then
        if(not public.user_is('administrator')) then
            update public.invoice_data set state = 'pending' where invoice_id = old.invoice_id;
        end if;

    elseif (invoice.state = 'rejected') then
        update public.invoice_data set state = 'pending' where invoice_id = old.invoice_id;
    end if;

    if (select count(*) from public.supplier_data where invoice_id = old.invoice_id) = 0 then
        delete from public.invoice_data where invoice_id = old.invoice_id;
    end if;

    perform public.update_bill_quantities(old.base_bill_id);

    return old;
end;
$$ language plpgsql security definer;

CREATE TRIGGER update_base_bill_quantity_after_supplier_data_delete
AFTER delete ON public.supplier_data FOR each ROW
EXECUTE procedure public.update_invoice_state_after_supplier_data_delete ();

CREATE OR REPLACE FUNCTION public.update_quantities_after_supplier_data_updates () returns trigger AS $$
begin
    if (old.billed_quantity <> new.billed_quantity) then
        perform public.update_bill_quantities(old.base_bill_id);
    end if;

    return old;
end
$$ language plpgsql security definer;

CREATE TRIGGER update_quantities_after_supplier_data_updates
AFTER
UPDATE ON public.supplier_data FOR each ROW
EXECUTE procedure public.update_quantities_after_supplier_data_updates ();

CREATE OR REPLACE FUNCTION public.update_quantities_after_supplier_data_insert () returns trigger AS $$
begin
    perform public.update_bill_quantities(new.base_bill_id);

    return new;
end
$$ language plpgsql security definer;

CREATE TRIGGER update_quantities_after_supplier_data_insert
AFTER insert ON public.supplier_data FOR each ROW
EXECUTE procedure public.update_quantities_after_supplier_data_insert ();
