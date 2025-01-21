CREATE TYPE app_options AS ENUM('trm_usd', 'trm_eur');


CREATE TABLE public.appdata (
  key app_options PRIMARY KEY NOT NULL,
  value jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);


ALTER TABLE public.appdata enable ROW level security;


CREATE POLICY "Select for appdata" ON public.appdata FOR
SELECT
  TO authenticated USING (public.role_has_permission ('appdata', B'0001'));


CREATE POLICY "Insert for appdata" ON public.appdata FOR insert TO authenticated
WITH
  CHECK (public.role_has_permission ('appdata', B'0010'));


CREATE POLICY "Update for appdata" ON public.appdata
FOR UPDATE
  TO authenticated USING (public.role_has_permission ('appdata', B'0100'));


CREATE POLICY "Delete for appdata" ON public.appdata FOR delete TO authenticated USING (public.role_has_permission ('appdata', B'1000'));


INSERT INTO
  access.table_names (name)
VALUES
  ('appdata');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('appdata', 'administrator', B'1111');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('appdata', 'employee', B'0001');


CREATE FUNCTION public.after_appdata_update () returns trigger AS $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER after_update_appdata
AFTER
UPDATE ON public.appdata FOR each ROW
EXECUTE procedure public.after_appdata_update ();
