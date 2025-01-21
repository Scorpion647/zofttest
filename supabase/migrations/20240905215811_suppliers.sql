-- SUPPLIER TABLE
CREATE TABLE public.suppliers (
  supplier_id serial NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  PRIMARY KEY (supplier_id),
  UNIQUE (domain)
);


CREATE FUNCTION supplier_search (public.suppliers) returns TEXT AS $$
  select $1.name|| ' ' || $1.domain || ' '
$$ language sql immutable;


-- permissions
INSERT INTO
  access.table_names (name)
VALUES
  ('suppliers');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('suppliers', 'administrator', B'1111');


-- SUPPLIER EMPLOYEE TABLE
CREATE TABLE public.supplier_employees (
  supplier_employee_id serial PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles (profile_id) ON DELETE cascade ON UPDATE cascade NOT NULL,
  supplier_id int4 REFERENCES public.suppliers (supplier_id) ON DELETE cascade ON UPDATE cascade NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (profile_id, supplier_id)
);


INSERT INTO
  access.table_names (name)
VALUES
  ('supplier_employees');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('supplier_employees', 'administrator', B'1111');


-- rls for supplier employees
ALTER TABLE public.supplier_employees enable ROW level security;


CREATE FUNCTION is_employee (
  _supplier_id INTEGER,
  _profile_id UUID DEFAULT auth.uid ()
) returns BOOLEAN AS $$
begin
        return (select true from public.supplier_employees se where se.supplier_id=_supplier_id and se.profile_id = _profile_id) or false;
end;
$$ language plpgsql security invoker;


CREATE POLICY "Select for supplier employees" ON public.supplier_employees FOR
SELECT
  TO authenticated USING (
    public.supplier_employees.profile_id = auth.uid ()
    OR public.role_has_permission ('supplier_employees', B'0001')
    OR (
      is_employee (
        public.supplier_employees.supplier_id,
        auth.uid ()
      )
    )
  );


CREATE POLICY "Insert for supplier employees" ON public.supplier_employees FOR insert TO authenticated
WITH
  CHECK (
    public.role_has_permission ('supplier_employees', B'0010')
  );


CREATE POLICY "Update for supplier employees" ON public.supplier_employees
FOR UPDATE
  TO authenticated USING (
    public.role_has_permission ('supplier_employees', B'0100')
  );


CREATE POLICY "Delete for supplier employees" ON public.supplier_employees FOR delete TO authenticated USING (
  public.role_has_permission ('supplier_employees', B'1000')
);


-- rls for suppliers
ALTER TABLE public.suppliers enable ROW level security;


CREATE POLICY "Select for suppliers" ON public.suppliers FOR
SELECT
  TO authenticated USING (public.role_has_permission ('suppliers', B'0001'));


CREATE POLICY "Insert for suppliers" ON public.suppliers FOR insert TO authenticated
WITH
  CHECK (public.role_has_permission ('suppliers', B'0010'));


CREATE POLICY "Update for suppliers" ON public.suppliers
FOR UPDATE
  TO authenticated USING (public.role_has_permission ('suppliers', B'0100'));


CREATE POLICY "Delete for suppliers" ON public.suppliers FOR delete TO authenticated USING (public.role_has_permission ('suppliers', B'1000'));


CREATE POLICY "Employees can select" ON public.suppliers FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.supplier_employees
      WHERE
        supplier_employees.supplier_id = public.suppliers.supplier_id
        AND supplier_employees.profile_id = auth.uid ()
    )
  );


-- trigger when supplier employee is inserted
CREATE FUNCTION public.after_supplier_employee_insert () returns trigger AS $$
declare
    old_role access.user_roles;
begin
    old_role := (select user_role from public.profiles where profiles.profile_id = new.profile_id);

    if (old_role = 'guest') then
        update public.profiles set user_role = 'employee' where profiles.profile_id = new.profile_id;
    end if;

    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER after_supplier_employee_insert
AFTER insert ON public.supplier_employees FOR each ROW
EXECUTE procedure public.after_supplier_employee_insert ();


-- trigger when supplier employee is removed
CREATE FUNCTION public.after_supplier_employee_delete () returns trigger AS $$
declare
    _old_profile public.profiles%rowtype;
begin
    select * into _old_profile from public.profiles where profiles.profile_id = old.profile_id;
    if (_old_profile.user_role <> 'administrator') then
        if (select count(*) from public.supplier_employees where supplier_employees.profile_id = old.profile_id) =
           0 then
            update public.profiles set user_role = 'guest' where profiles.profile_id = old.profile_id;
        end if;
    end if;

    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER after_supplier_employee_delete
AFTER delete ON public.supplier_employees FOR each ROW
EXECUTE procedure public.after_supplier_employee_delete ();


CREATE FUNCTION public.after_supplier_employee_update () returns trigger AS $$
declare
    _old_profile public.profiles%rowtype;
    _new_profile public.profiles%rowtype;
begin
    if (old.profile_id <> new.profile_id) then
        if (select count(*) from public.supplier_employees where supplier_employees.profile_id = old.profile_id) =
           0 then
            select * into _old_profile from public.profiles where profiles.profile_id = old.profile_id;

            if (_old_profile.user_role <> 'administrator') then
                update public.profiles set user_role = 'guest' where profiles.profile_id = old.profile_id;
            end if;
        end if;

        select * into _new_profile from public.profiles where profiles.profile_id = new.profile_id;

        if (_new_profile.user_role = 'guest') then
            update public.profiles set user_role = 'employee' where profiles.profile_id = new.profile_id;
        end if;
    end if;

    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER after_supplier_employee_update
AFTER
UPDATE ON public.supplier_employees FOR each ROW
EXECUTE procedure public.after_supplier_employee_update ();
