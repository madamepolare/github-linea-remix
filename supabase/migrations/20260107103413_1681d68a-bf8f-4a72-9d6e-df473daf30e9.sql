-- Fix permissive RLS policy on document_signature_events (INSERT)
-- Replace overly-permissive WITH CHECK (true) with a scoped rule.

DROP POLICY IF EXISTS "Anyone can insert events" ON public.document_signature_events;

CREATE POLICY "Requesters can insert signature events"
ON public.document_signature_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.document_signatures ds
    WHERE ds.id = document_signature_events.signature_id
      AND ds.requested_by = auth.uid()
  )
);