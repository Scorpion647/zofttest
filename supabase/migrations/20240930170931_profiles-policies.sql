CREATE POLICY "Select as admin, or select own or coworkers profiles" ON public.profiles FOR
SELECT
  TO authenticated USING (
    (profile_id = auth.uid ())
    OR (public.role_has_permission ('profiles', B'0001'))
    OR (
      EXISTS (
        SELECT
          1
        FROM
          public.supplier_employees se
        WHERE
          profiles.profile_id = se.profile_id
      )
    ) -- users can select coworkers so they can see their profile
  );
