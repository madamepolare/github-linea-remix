-- Allow project_id to be null for tender-related events
ALTER TABLE project_calendar_events ALTER COLUMN project_id DROP NOT NULL;