-- Add new values to the element_type enum
ALTER TYPE public.element_type ADD VALUE IF NOT EXISTS 'credential';
ALTER TYPE public.element_type ADD VALUE IF NOT EXISTS 'image_ref';