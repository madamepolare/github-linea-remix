-- Backfill: migrate existing task_comments into communications for project aggregation.
-- We intentionally drop legacy threading (parent_id) to avoid FK issues.
INSERT INTO public.communications (
  workspace_id,
  communication_type,
  entity_type,
  entity_id,
  parent_id,
  thread_id,
  title,
  content,
  mentions,
  attachments,
  email_metadata,
  is_read,
  is_pinned,
  created_by,
  created_at,
  updated_at,
  context_entity_type,
  context_entity_id
)
SELECT
  tc.workspace_id,
  'comment'::text,
  'task'::text,
  tc.task_id,
  NULL,
  NULL,
  NULL,
  tc.content,
  tc.mentions,
  NULL,
  NULL,
  false,
  false,
  tc.author_id,
  COALESCE(tc.created_at, now()),
  COALESCE(tc.updated_at, tc.created_at, now()),
  'project'::text,
  t.project_id
FROM public.task_comments tc
JOIN public.tasks t ON t.id = tc.task_id
WHERE t.project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.communications c
    WHERE c.communication_type = 'comment'
      AND c.entity_type = 'task'
      AND c.entity_id = tc.task_id
      AND c.content = tc.content
      AND COALESCE(c.created_at::timestamptz, now()) = COALESCE(tc.created_at::timestamptz, now())
  );