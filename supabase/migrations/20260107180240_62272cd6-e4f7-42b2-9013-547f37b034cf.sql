-- Add contact fields to tender_calendar_events
ALTER TABLE public.tender_calendar_events
ADD COLUMN contact_name TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT;