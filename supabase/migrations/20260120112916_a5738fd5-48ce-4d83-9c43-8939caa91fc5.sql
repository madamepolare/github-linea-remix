-- Force inbound emails in a Gmail thread to use the same company/contact as the latest outbound in that thread
WITH outbound AS (
  SELECT DISTINCT ON (workspace_id, gmail_thread_id)
    workspace_id,
    gmail_thread_id,
    contact_id AS outbound_contact_id,
    company_id AS outbound_company_id
  FROM crm_emails
  WHERE gmail_thread_id IS NOT NULL
    AND direction = 'outbound'
    AND (contact_id IS NOT NULL OR company_id IS NOT NULL)
  ORDER BY workspace_id, gmail_thread_id, COALESCE(sent_at, created_at) DESC
)
UPDATE crm_emails e
SET
  contact_id = COALESCE(o.outbound_contact_id, e.contact_id),
  company_id = o.outbound_company_id
FROM outbound o
WHERE e.direction = 'inbound'
  AND e.gmail_thread_id = o.gmail_thread_id
  AND e.workspace_id = o.workspace_id
  AND o.outbound_company_id IS NOT NULL
  AND (e.company_id IS DISTINCT FROM o.outbound_company_id);