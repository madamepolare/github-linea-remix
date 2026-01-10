-- Create quote_themes table for storing custom quote styling
CREATE TABLE public.quote_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Colors
  primary_color TEXT DEFAULT '#0a0a0a',
  secondary_color TEXT DEFAULT '#737373',
  accent_color TEXT DEFAULT '#7c3aed',
  background_color TEXT DEFAULT '#ffffff',
  header_bg_color TEXT,
  
  -- Typography
  heading_font TEXT DEFAULT 'Inter',
  body_font TEXT DEFAULT 'Inter',
  heading_size TEXT DEFAULT '24px',
  body_size TEXT DEFAULT '11px',
  
  -- Layout
  header_style TEXT DEFAULT 'classic', -- classic, modern, minimal, centered
  show_logo BOOLEAN DEFAULT true,
  logo_position TEXT DEFAULT 'left', -- left, center, right
  logo_size TEXT DEFAULT 'medium', -- small, medium, large
  
  -- Table styling
  table_header_bg TEXT DEFAULT '#f5f5f5',
  table_border_style TEXT DEFAULT 'solid', -- solid, dashed, none
  table_stripe_rows BOOLEAN DEFAULT false,
  
  -- Footer
  footer_style TEXT DEFAULT 'simple', -- simple, detailed, minimal
  show_signature_area BOOLEAN DEFAULT true,
  
  -- AI generated reference image
  reference_image_url TEXT,
  ai_generated_css TEXT,
  
  -- Meta
  is_default BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.quote_themes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their workspace quote themes"
ON public.quote_themes FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert quote themes in their workspace"
ON public.quote_themes FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their workspace quote themes"
ON public.quote_themes FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their workspace quote themes"
ON public.quote_themes FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
  )
);

-- Add quote_theme_id to commercial_documents
ALTER TABLE public.commercial_documents
ADD COLUMN IF NOT EXISTS quote_theme_id UUID REFERENCES public.quote_themes(id);

-- Create trigger for updated_at
CREATE TRIGGER update_quote_themes_updated_at
  BEFORE UPDATE ON public.quote_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();