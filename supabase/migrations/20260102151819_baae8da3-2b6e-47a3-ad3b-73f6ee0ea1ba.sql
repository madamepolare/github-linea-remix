-- Add assignee_lot_ids column to meeting_attention_items
ALTER TABLE public.meeting_attention_items 
ADD COLUMN assignee_lot_ids text[] DEFAULT '{}' :: text[];