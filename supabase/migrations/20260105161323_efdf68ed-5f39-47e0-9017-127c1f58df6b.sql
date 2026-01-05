-- Add sub_row column to project_lot_interventions for sub-line organization
ALTER TABLE public.project_lot_interventions
ADD COLUMN sub_row integer NOT NULL DEFAULT 0;

-- Add index for efficient querying
CREATE INDEX idx_interventions_lot_subrow ON public.project_lot_interventions(lot_id, sub_row);