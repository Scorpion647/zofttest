INSERT INTO
  storage.buckets (id, name, allowed_mime_types)
VALUES
  ('invoices', 'invoices', '{ "application/pdf" }');


CREATE POLICY "Invoice documents access" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT
          1
        FROM
          supplier_employees em
        WHERE
          em.supplier_id::TEXT = (storage.foldername (name)) [1]
          AND profile_id = auth.uid ()
      )
      OR EXISTS (
        SELECT
          1
        FROM
          profiles p
        WHERE
          p.profile_id = auth.uid ()
          AND p.user_role = 'administrator'
      )
    )
  );


CREATE POLICY "Invoice documents upload" ON storage.objects FOR insert TO authenticated
WITH
  CHECK (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT
          1
        FROM
          supplier_employees em
        WHERE
          em.supplier_id::TEXT = (storage.foldername (name)) [1]
          AND profile_id = auth.uid ()
      )
      OR EXISTS (
        SELECT
          1
        FROM
          profiles p
        WHERE
          p.profile_id = auth.uid ()
          AND p.user_role = 'administrator'
      )
    )
  );


CREATE POLICY "Invoice documents update" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'invoices'
    AND (
      EXISTS (
        SELECT
          1
        FROM
          supplier_employees em
        WHERE
          em.supplier_id::TEXT = (storage.foldername (name)) [1]
          AND profile_id = auth.uid ()
      )
      OR EXISTS (
        SELECT
          1
        FROM
          profiles p
        WHERE
          p.profile_id = auth.uid ()
          AND p.user_role = 'administrator'
      )
    )
  );


CREATE POLICY "Invoice documents remove" ON storage.objects FOR delete TO authenticated USING (
  bucket_id = 'invoices'
  AND (
    EXISTS (
      SELECT
        1
      FROM
        supplier_employees em
      WHERE
        em.supplier_id::TEXT = (storage.foldername (name)) [1]
        AND profile_id = auth.uid ()
    )
    OR EXISTS (
      SELECT
        1
      FROM
        profiles p
      WHERE
        p.profile_id = auth.uid ()
        AND p.user_role = 'administrator'
    )
  )
);