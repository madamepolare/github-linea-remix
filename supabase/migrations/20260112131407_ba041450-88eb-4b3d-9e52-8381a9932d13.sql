-- Add style/font settings to workspace table for persistence
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS style_settings jsonb DEFAULT '{}';

-- This column will store:
-- {
--   "headingFont": "inter",
--   "bodyFont": "inter", 
--   "baseFontSize": 14,
--   "headingWeight": "600",
--   "bodyWeight": "400",
--   "borderRadius": 8,
--   "colorTheme": "default",
--   "customFonts": []  -- array of custom font configs
-- }

COMMENT ON COLUMN public.workspaces.style_settings IS 'Workspace-wide style and typography settings (fonts, colors, etc.)';