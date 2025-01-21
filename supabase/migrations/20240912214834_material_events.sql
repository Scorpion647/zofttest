ALTER TABLE public.materials enable ROW level security;


CREATE POLICY "Select for materials" ON public.materials FOR
SELECT
  TO authenticated USING (
    public.role_has_permission ('materials', B'0001')
    OR EXISTS (
      SELECT
        1
      FROM
        public.base_bills b
      WHERE
        b.material_code = public.materials.material_code
    )
  );


CREATE POLICY "Insert for materials" ON public.materials FOR insert TO authenticated
WITH
  CHECK (public.role_has_permission ('materials', B'0010'));


CREATE POLICY "Update for materials" ON public.materials
FOR UPDATE
  TO authenticated USING (public.role_has_permission ('materials', B'0100'));


CREATE POLICY "Delete for materials" ON public.materials FOR delete TO authenticated USING (public.role_has_permission ('materials', B'1000'));


CREATE
OR REPLACE function public.before_materials_update () returns trigger AS $$
begin
    -- if the user is not an administrator, then the subheading is the only field that can be updated
    if (not public.user_is('administrator')) then
        if (new.subheading is distinct from old.subheading) then
            if (old.subheading is not null) then
                raise exception 'The subheading cannot be updated once it has been set';
            end if;
        end if;

        if (new.type is distinct from old.type or
            new.material_code is distinct from old.material_code or
            new.measurement_unit is distinct from old.measurement_unit or
            new.created_at is distinct from old.created_at) then

            raise exception 'You are not allowed to change the type, material code, measurement unit or created at of a material';
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;


CREATE TRIGGER before_materials_update before
UPDATE ON public.materials FOR each ROW
EXECUTE procedure public.before_materials_update ();
