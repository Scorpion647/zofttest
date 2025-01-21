CREATE TABLE public.data_tracking (
  id serial PRIMARY KEY,
  purchase_order VARCHAR,
  items int4,
  code VARCHAR,
  description VARCHAR,
  quantity DECIMAL,
  bill_measurement_unit VARCHAR,
  supplier_name VARCHAR,
  bill_number VARCHAR,
  fmm VARCHAR,
  subheading VARCHAR,
  material_measurement_unit VARCHAR,
  trm NUMERIC,
  bill_unit_price int8,
  bill_total_price int8,
  data_unit_price int8,
  data_total_price int8,
  type material_type,
  gross_weight NUMERIC,
  packages NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE
OR REPLACE function track_bill (
  bill_id UUID,
  clean_bill BOOLEAN DEFAULT FALSE,
  clean_data BOOLEAN DEFAULT FALSE
) returns void AS $$
    declare
        _base_bill public.base_bills%rowtype;
        _material public.materials%rowtype;
        _supplier public.suppliers%rowtype;
        _supplier_data_record record;
BEGIN
    select * into _base_bill from public.base_bills where base_bill_id = $1;
    select * into _material from public.materials where material_code = _base_bill.material_code;
    select * into _supplier from public.suppliers where supplier_id = _base_bill.supplier_id;

    for _supplier_data_record in select * from public.supplier_data where base_bill_id=$1 loop
        insert into public.data_tracking (
            purchase_order,
            items,
            code,
            description,
            quantity,
            bill_measurement_unit,
            supplier_name,
            bill_number,
            fmm,
            subheading,
            material_measurement_unit,
            trm,
            bill_unit_price,
            bill_total_price,
            data_unit_price,
            data_total_price,
            type,
            gross_weight,
            packages
        ) values (
            _base_bill.purchase_order,
            _base_bill.item,
            _material.material_code,
            _base_bill.description,
            _supplier_data_record.billed_quantity,
            _base_bill.measurement_unit,
            _supplier.name,
            _supplier_data_record.bill_number,
            'To define',
            _material.subheading,
            _material.measurement_unit,
            _supplier_data_record.trm,
            _base_bill.unit_price,
            _base_bill.net_price,
            _supplier_data_record.billed_unit_price,
            _supplier_data_record.billed_total_price,
            _material.type,
            _supplier_data_record.gross_weight,
            _supplier_data_record.packages
        );
    end loop;

    if (clean_bill) then
        delete from public.base_bills where base_bill_id=$1;
    elseif(clean_data) then
        delete from public.supplier_data where base_bill_id=$1;
    end if;
END
$$ language plpgsql;
