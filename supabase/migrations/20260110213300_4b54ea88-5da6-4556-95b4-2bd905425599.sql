-- Add pdf_config column to contract_types for configurable PDF blocks
ALTER TABLE contract_types ADD COLUMN IF NOT EXISTS pdf_config jsonb DEFAULT '{}'::jsonb;

-- Update existing contract types with default PDF configurations
UPDATE contract_types 
SET pdf_config = jsonb_build_object(
  'quote', jsonb_build_array(
    jsonb_build_object('block_type', 'header', 'sort_order', 1, 'is_required', true),
    jsonb_build_object('block_type', 'client', 'sort_order', 2, 'is_required', true),
    jsonb_build_object('block_type', 'project', 'sort_order', 3, 'is_required', true),
    jsonb_build_object('block_type', 'lines', 'sort_order', 4, 'is_required', true),
    jsonb_build_object('block_type', 'totals', 'sort_order', 5, 'is_required', true),
    jsonb_build_object('block_type', 'payment', 'sort_order', 6, 'is_required', false),
    jsonb_build_object('block_type', 'conditions', 'sort_order', 7, 'is_required', false),
    jsonb_build_object('block_type', 'signatures', 'sort_order', 8, 'is_required', true)
  ),
  'contract', jsonb_build_array(
    jsonb_build_object('block_type', 'cover', 'sort_order', 1, 'is_required', false),
    jsonb_build_object('block_type', 'header', 'sort_order', 2, 'is_required', true),
    jsonb_build_object('block_type', 'client', 'sort_order', 3, 'is_required', true),
    jsonb_build_object('block_type', 'project', 'sort_order', 4, 'is_required', true),
    jsonb_build_object('block_type', 'lines', 'sort_order', 5, 'is_required', true),
    jsonb_build_object('block_type', 'totals', 'sort_order', 6, 'is_required', true),
    jsonb_build_object('block_type', 'payment', 'sort_order', 7, 'is_required', true),
    jsonb_build_object('block_type', 'conditions', 'sort_order', 8, 'is_required', true),
    jsonb_build_object('block_type', 'signatures', 'sort_order', 9, 'is_required', true)
  ),
  'proposal', jsonb_build_array(
    jsonb_build_object('block_type', 'cover', 'sort_order', 1, 'is_required', true),
    jsonb_build_object('block_type', 'project', 'sort_order', 2, 'is_required', true),
    jsonb_build_object('block_type', 'lines', 'sort_order', 3, 'is_required', true),
    jsonb_build_object('block_type', 'totals', 'sort_order', 4, 'is_required', true),
    jsonb_build_object('block_type', 'signatures', 'sort_order', 5, 'is_required', false)
  )
)
WHERE pdf_config IS NULL OR pdf_config = '{}'::jsonb;