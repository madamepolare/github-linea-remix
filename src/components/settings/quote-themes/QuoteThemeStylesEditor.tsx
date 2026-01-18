import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Type, Layout, Table } from 'lucide-react';
import { QuoteTheme } from '@/hooks/useQuoteThemes';

interface QuoteThemeStylesEditorProps {
  theme: Partial<QuoteTheme>;
  onChange: <K extends keyof QuoteTheme>(field: K, value: QuoteTheme[K]) => void;
}

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Nunito',
  'Playfair Display',
  'Source Sans 3',
  'DM Sans',
  'Space Grotesk',
  'Montserrat',
  'Lato',
];

const HEADER_STYLES = [
  { value: 'classic', label: 'Classique' },
  { value: 'modern', label: 'Moderne' },
  { value: 'minimal', label: 'Minimaliste' },
  { value: 'centered', label: 'Centré' },
];

export function QuoteThemeStylesEditor({ theme, onChange }: QuoteThemeStylesEditorProps) {
  return (
    <div className="space-y-6">
      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Couleurs
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Couleur principale</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.primary_color || '#0a0a0a'}
                onChange={(e) => onChange('primary_color', e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={theme.primary_color || '#0a0a0a'}
                onChange={(e) => onChange('primary_color', e.target.value)}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Couleur secondaire</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.secondary_color || '#737373'}
                onChange={(e) => onChange('secondary_color', e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={theme.secondary_color || '#737373'}
                onChange={(e) => onChange('secondary_color', e.target.value)}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Couleur accent</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.accent_color || '#7c3aed'}
                onChange={(e) => onChange('accent_color', e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={theme.accent_color || '#7c3aed'}
                onChange={(e) => onChange('accent_color', e.target.value)}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Fond</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.background_color || '#ffffff'}
                onChange={(e) => onChange('background_color', e.target.value)}
                className="w-12 h-9 p-1 cursor-pointer"
              />
              <Input
                value={theme.background_color || '#ffffff'}
                onChange={(e) => onChange('background_color', e.target.value)}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Type className="h-4 w-4" />
          Typographie
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Police titres</Label>
            <Select
              value={theme.heading_font || 'Inter'}
              onValueChange={(v) => onChange('heading_font', v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(font => (
                  <SelectItem key={font} value={font}>{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Police corps</Label>
            <Select
              value={theme.body_font || 'Inter'}
              onValueChange={(v) => onChange('body_font', v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(font => (
                  <SelectItem key={font} value={font}>{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Mise en page
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Style en-tête</Label>
            <Select
              value={theme.header_style || 'classic'}
              onValueChange={(v) => onChange('header_style', v as QuoteTheme['header_style'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADER_STYLES.map(style => (
                  <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Position logo</Label>
            <Select
              value={theme.logo_position || 'left'}
              onValueChange={(v) => onChange('logo_position', v as QuoteTheme['logo_position'])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Gauche</SelectItem>
                <SelectItem value="center">Centre</SelectItem>
                <SelectItem value="right">Droite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Afficher le logo</Label>
          <Switch
            checked={theme.show_logo ?? true}
            onCheckedChange={(v) => onChange('show_logo', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Zone signature</Label>
          <Switch
            checked={theme.show_signature_area ?? true}
            onCheckedChange={(v) => onChange('show_signature_area', v)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Table className="h-4 w-4" />
          Tableau
        </h4>
        <div className="space-y-2">
          <Label className="text-xs">Fond en-tête tableau</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={theme.table_header_bg || '#f5f5f5'}
              onChange={(e) => onChange('table_header_bg', e.target.value)}
              className="w-12 h-9 p-1 cursor-pointer"
            />
            <Input
              value={theme.table_header_bg || '#f5f5f5'}
              onChange={(e) => onChange('table_header_bg', e.target.value)}
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Lignes alternées</Label>
          <Switch
            checked={theme.table_stripe_rows ?? false}
            onCheckedChange={(v) => onChange('table_stripe_rows', v)}
          />
        </div>
      </div>
    </div>
  );
}
