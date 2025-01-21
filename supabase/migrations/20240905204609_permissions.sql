CREATE SCHEMA if NOT EXISTS access AUTHORIZATION postgres;


REVOKE ALL ON schema access
FROM
  authenticated,
  anon,
  public;


CREATE TYPE access.user_roles AS ENUM('administrator', 'employee', 'guest');


CREATE TABLE IF NOT EXISTS access.table_names (name VARCHAR(40) PRIMARY KEY);


CREATE TABLE IF NOT EXISTS access.table_permissions (
  table_name VARCHAR(40) NOT NULL,
  user_role access.user_roles NOT NULL,
  permissions BIT(4) NOT NULL,
  PRIMARY KEY (table_name, user_role),
  FOREIGN key (table_name) REFERENCES access.table_names (name)
);


-- SELECT 0001
-- INSERT 0010
-- UPDATE 0100
-- DELETE 1000
CREATE FUNCTION public.role_has_permission (
  table_name VARCHAR,
  user_permission BIT(4) = B'0001', -- SELECT AS DEFAULT
  user_role access.user_roles = NULL -- DEFAULT TO CURRENT USER ROLE
) returns BOOLEAN AS $$
declare
    _permission bit(4);
    _table_name alias for table_name;
    _user_role alias for user_role;
begin
    if _user_role is null
    then
        select p.user_role into _user_role from public.profiles p where p.profile_id = auth.uid();

        if not found
        then
            raise exception 'user_not_found';
        end if;
    end if;

    select
        p.permissions
    into _permission
    from
        access.table_permissions p
    where
          p.table_name = _table_name
      and p.user_role = _user_role;

    if found
    then
        return (_permission & user_permission) = user_permission;
    else
        return false;
    end if;
end;
$$ language plpgsql security definer
SET
  search_path = public;
