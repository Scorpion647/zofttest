-- Crea la tabla para almacenar direcciones de correo electrónico
CREATE TABLE email_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Función para actualizar la columna updated_at automáticamente
CREATE
OR REPLACE function update_updated_at () returns trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;


-- Trigger que llama a la función update_updated_at() antes de cada actualización en la tabla email_recipients
CREATE TRIGGER email_recipients_updated_at_trigger before
UPDATE ON email_recipients FOR each ROW
EXECUTE function update_updated_at ();


-- Row level security
ALTER TABLE email_recipients enable ROW level security;


CREATE POLICY "Enable read access for authenticated users" ON email_recipients AS permissive FOR
SELECT
  TO authenticated USING (public.role_has_permission ('appdata', B'0100'));


CREATE POLICY "Enable insert access for authenticated users" ON email_recipients AS permissive FOR insert TO authenticated
WITH
  CHECK (public.role_has_permission ('appdata', B'0100'));


CREATE POLICY "Enable update access for the user who inserted it" ON email_recipients AS permissive
FOR UPDATE
  TO authenticated USING (public.role_has_permission ('appdata', B'0100'))
WITH
  CHECK (public.role_has_permission ('appdata', B'0100'));


CREATE POLICY "Enable delete access for the user who inserted it" ON email_recipients AS permissive FOR delete TO authenticated USING (public.role_has_permission ('appdata', B'0100'));


-- Administración de permisos
INSERT INTO
  access.table_names (name)
VALUES
  ('email_recipients');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('email_recipients', 'administrator', B'1111');
