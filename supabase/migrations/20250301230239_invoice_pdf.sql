CREATE TABLE public.invoice_docs (
  doc_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_id UUID NOT NULL REFERENCES public.invoice_data (invoice_id) ON DELETE cascade,
  uploaded_at TIMESTAMP DEFAULT NOW()
);


CREATE POLICY "User can select their own objects" ON storage.objects FOR
SELECT
  TO authenticated USING (
    owner_id = (
      SELECT
        auth.uid ()
    )::TEXT
    OR EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.profile_id = auth.uid ()
        AND p.user_role = 'administrator'
    )
  );


CREATE POLICY "Employees can insert objects" ON storage.objects FOR insert TO authenticated
WITH
  CHECK (
    owner_id = (
      SELECT
        auth.uid ()
    )::TEXT
    OR EXISTS (
      SELECT
        1
      FROM
        public.profiles p
      WHERE
        p.profile_id = auth.uid ()
        AND p.user_role = 'administrator'
    )
  );


CREATE POLICY "User can update their own objects" ON storage.objects FOR delete TO authenticated USING (
  owner_id = (
    SELECT
      auth.uid ()
  )::TEXT
  OR EXISTS (
    SELECT
      1
    FROM
      public.profiles p
    WHERE
      p.profile_id = auth.uid ()
      AND p.user_role = 'administrator'
  )
);


CREATE POLICY "User can delete their own objects" ON storage.objects FOR delete TO authenticated USING (
  owner_id = (
    SELECT
      auth.uid ()
  )::TEXT
  OR EXISTS (
    SELECT
      1
    FROM
      public.profiles p
    WHERE
      p.profile_id = auth.uid ()
      AND p.user_role = 'administrator'
  )
);


ALTER TABLE invoice_docs enable ROW level security;


CREATE POLICY "Admin and employee can select invoice docs" ON public.invoice_docs FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.invoice_data d
      WHERE
        d.invoice_id = invoice_id
    )
  );


CREATE POLICY "Admin can insert invoice docs" ON public.invoice_docs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.invoice_data d
    WHERE d.invoice_id = invoice_id
  )
);


CREATE POLICY "Admin can update invoice docs" ON public.invoice_docs FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.invoice_data d
      WHERE
        d.invoice_id = invoice_id
    )
  );


CREATE POLICY "Admin can delete invoice docs" ON public.invoice_docs FOR
SELECT
  TO authenticated USING (
    EXISTS (
      SELECT
        1
      FROM
        public.invoice_data d
      WHERE
        d.invoice_id = invoice_id
    )
  );


ALTER TABLE public.invoice_data
ADD COLUMN approved_date TIMESTAMP DEFAULT NULL;


CREATE
OR REPLACE function set_invoice_approved_date () returns trigger AS $$
BEGIN
  IF NEW.state = 'approved' AND OLD.state<>'approved' THEN
    NEW.approved_date = NOW();
  END IF;
  RETURN NEW; END; $$ language plpgsql;


CREATE TRIGGER update_approved_date_trigger before insert
OR
UPDATE ON invoice_data FOR each ROW
EXECUTE function set_invoice_approved_date ();


CREATE
OR REPLACE function update_invoice_state_after_doc_change () returns trigger AS $$
BEGIN
  UPDATE invoice_data 
  SET state = 'pending', approved_date = NULL 
  WHERE invoice_id = NEW.invoice_id;  RETURN NEW;
END;
$$ language plpgsql;


CREATE TRIGGER update_invoice_doc_state
AFTER
UPDATE
OR insert ON invoice_docs FOR each ROW
EXECUTE function update_invoice_state_after_doc_change ();


CREATE
OR REPLACE function delete_old_invoice_docs () returns TABLE (file_url TEXT) AS $$
BEGIN
  RETURN QUERY
    DELETE FROM invoice_docs doc
    WHERE doc.invoice_id IN (
        SELECT d.invoice_id 
        FROM invoice_data d
        WHERE d.state = 'approved' 
          AND d.approved_date IS NOT NULL 
          AND d.approved_date < NOW() - INTERVAL '7 days'
    )
    RETURNING doc.file_url;
END;
$$ language plpgsql security definer;
