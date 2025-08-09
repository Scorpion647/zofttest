CREATE OR REPLACE FUNCTION delete_old_invoice_docs () returns TABLE (path TEXT) AS $$
BEGIN
    RETURN QUERY DELETE FROM invoice_docs doc USING invoice_data d
    WHERE doc.invoice_id = d.invoice_id
        AND d.state = 'approved'
        AND d.approved_date IS NOT NULL
        AND d.approved_date < NOW() - INTERVAL '7 days'
    RETURNING (d.supplier_id::text || '/' || d.invoice_id::text || '/' || doc.doc_id::text) AS path;
END;
$$ language plpgsql security definer;
