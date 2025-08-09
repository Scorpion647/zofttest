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

CREATE OR REPLACE FUNCTION track_bill (
  bill_id UUID,
  clean_bill BOOLEAN DEFAULT FALSE,
  clean_data BOOLEAN DEFAULT FALSE
) returns void AS $$
DECLARE
    _base_bill public.base_bills%rowtype;
    _material public.materials%rowtype;
    _supplier public.suppliers%rowtype;
    _supplier_data_record record;
BEGIN
    SELECT
        * INTO _base_bill
    FROM
        public.base_bills
    WHERE
        base_bill_id = $1;
    SELECT
        * INTO _material
    FROM
        public.materials
    WHERE
        material_code = _base_bill.material_code;
    SELECT
        * INTO _supplier
    FROM
        public.suppliers
    WHERE
        supplier_id = _base_bill.supplier_id;
    FOR _supplier_data_record IN
    SELECT
        *
    FROM
        public.supplier_data
    WHERE
        base_bill_id = $1 LOOP
            INSERT INTO public.data_tracking (purchase_order, items, code, description, quantity, bill_measurement_unit, supplier_name, bill_number, fmm, subheading, material_measurement_unit, trm, bill_unit_price, bill_total_price, data_unit_price, data_total_price, type, gross_weight, packages)
                VALUES (_base_bill.purchase_order, _base_bill.item, _material.material_code, _base_bill.description, _supplier_data_record.billed_quantity, _base_bill.measurement_unit, _supplier.name, _supplier_data_record.bill_number, 'To define', _material.subheading, _material.measurement_unit, _supplier_data_record.trm, _base_bill.unit_price, _base_bill.net_price, _supplier_data_record.billed_unit_price, _supplier_data_record.billed_total_price, _material.type, _supplier_data_record.gross_weight, _supplier_data_record.packages);
        END LOOP;
    IF (clean_bill) THEN
        DELETE FROM public.base_bills
        WHERE base_bill_id = $1;
        elseif (clean_data) THEN
        DELETE FROM public.supplier_data
        WHERE base_bill_id = $1;
    END IF;
END
$$ language plpgsql;
