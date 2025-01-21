-- PROFILE TABLE
CREATE EXTENSION citext
WITH
  schema extensions;


CREATE DOMAIN domain_email AS extensions.citext CHECK (TRUE);


CREATE TABLE public.profiles (
  profile_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE cascade,
  full_name VARCHAR(255) DEFAULT NULL,
  user_role access.user_roles DEFAULT 'guest',
  email domain_email DEFAULT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE FUNCTION profiles_search (public.profiles) returns TEXT AS $$
select $1.full_name || ' ' || $1.email;
$$ language sql immutable;


ALTER TABLE public.profiles enable ROW level security;


INSERT INTO
  access.table_names (name)
VALUES
  ('profiles');


INSERT INTO
  access.table_permissions (table_name, user_role, permissions)
VALUES
  ('profiles', 'administrator', B'1111');


-- TRIGGER WHEN USER IS INSERTED
CREATE FUNCTION public.on_user_insert () returns trigger AS $$
declare
    _username varchar(255);
begin
    _username := new.raw_user_meta_data ->> 'username';

    insert into
        public.profiles ( profile_id, full_name, email, created_at, updated_at )
    values ( new.id, _username, new.email, new.created_at, new.updated_at );
    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER on_user_insert
AFTER insert ON auth.users FOR each ROW
EXECUTE procedure public.on_user_insert ();


-- TRIGGER WHEN USER IS UPDATED
CREATE FUNCTION public.after_user_update () returns trigger AS $$
declare
    _username varchar(255) default null;
begin
    _username := new.raw_user_meta_data ->> 'username';

    update public.profiles
    set
        full_name  = coalesce(_username, full_name),
        email      = new.email,
        updated_at = new.updated_at
    where
        profiles.profile_id = new.id;

    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER after_user_update
AFTER
UPDATE ON auth.users FOR each ROW
EXECUTE procedure public.after_user_update ();


-- TRIGGER WHEN USER IS DELETED
CREATE FUNCTION public.after_profile_delete () returns trigger AS $$
begin
    delete from auth.users where auth.users.id = old.profile_id;
    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER after_profile_delete
AFTER delete ON public.profiles FOR each ROW
EXECUTE procedure public.after_profile_delete ();


CREATE POLICY "Insert profiles if has permission" ON public.profiles FOR insert TO authenticated
WITH
  CHECK (public.role_has_permission ('profiles', B'0010'));


CREATE POLICY "Update own profile or has permission" ON public.profiles
FOR UPDATE
  TO authenticated USING (
    profile_id = auth.uid ()
    OR public.role_has_permission ('profiles', B'0100')
  );


CREATE POLICY "Delete own profile or has permission" ON public.profiles FOR delete TO authenticated USING (
  profile_id = auth.uid ()
  OR public.role_has_permission ('profiles', B'1000')
);

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT p.user_role
    INTO user_role
    FROM public.profiles p
    WHERE p.profile_id = auth.uid()
    LIMIT 1;

    RETURN user_role;
END;
$$ LANGUAGE plpgsql;