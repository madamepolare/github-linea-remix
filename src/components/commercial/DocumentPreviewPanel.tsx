import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CommercialDocument, 
  CommercialDocumentPhase,
  DOCUMENT_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  STATUS_LABELS
} from '@/lib/commercialTypes';
import { ThemePreviewSelector } from './ThemePreviewSelector';
import { useQuoteThemes } from '@/hooks/useQuoteThemes';

interface DocumentPreviewPanelProps {
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  total: number;
  selectedThemeId?: string | null;
  onThemeChange?: (themeId: string | null) => void;
}

export function DocumentPreviewPanel({
  document,
  phases,
  total,
  selectedThemeId,
  onThemeChange
}: DocumentPreviewPanelProps) {
  const includedPhases = phases.filter(p => p.is_included);
  const { themes } = useQuoteThemes();
  const currentTheme = themes.find(t => t.id === selectedThemeId);

  // Apply theme styles
  const themeStyles = currentTheme ? {
    '--theme-primary': currentTheme.primary_color,
    '--theme-accent': currentTheme.accent_color,
    '--theme-bg': currentTheme.background_color,
    '--theme-secondary': currentTheme.secondary_color,
  } as React.CSSProperties : {};

  return (
    <Card className="sticky top-6" style={themeStyles}>
      {/* Theme Selector */}
      {onThemeChange && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <ThemePreviewSelector
            selectedThemeId={selectedThemeId || null}
            onThemeChange={onThemeChange}
            compact
          />
        </div>
      )}
      <CardHeader className="bg-muted/50" style={currentTheme ? { backgroundColor: currentTheme.accent_color + '10' } : {}}>
        <div className="text-center space-y-2">
          <Badge style={currentTheme ? { backgroundColor: currentTheme.accent_color, color: '#fff' } : {}}>
            {DOCUMENT_TYPE_LABELS[document.document_type || 'quote']}
          </Badge>
          <CardTitle className="text-xl" style={currentTheme ? { color: currentTheme.primary_color } : {}}>
            {document.title || 'Sans titre'}
          </CardTitle>
          {document.document_number && (
            <div className="text-sm text-muted-foreground">{document.document_number}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-auto">
        {/* Client Info */}
        {(document.client_company || document.client_contact) && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">CLIENT</div>
            {document.client_company && (
              <div className="font-medium">{document.client_company.name}</div>
            )}
            {document.client_contact && (
              <div className="text-sm text-muted-foreground">{document.client_contact.name}</div>
            )}
          </div>
        )}

        <Separator />

        {/* Project Info */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">PROJET</div>
          <div className="space-y-1">
            <div className="font-medium">
              {PROJECT_TYPE_LABELS[document.project_type || 'interior']}
            </div>
            {document.project_address && (
              <div className="text-sm text-muted-foreground">{document.project_address}</div>
            )}
            {document.project_city && (
              <div className="text-sm text-muted-foreground">{document.project_city}</div>
            )}
            <div className="flex gap-4 text-sm mt-2">
              {document.project_surface && (
                <span>{document.project_surface} m²</span>
              )}
              {document.project_budget && (
                <span>
                  Budget: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(document.project_budget)}
                </span>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Phases */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            MISSION ({includedPhases.length} phases)
          </div>
          <div className="space-y-2">
            {includedPhases.map((phase) => (
              <div key={phase.id} className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0 text-xs">
                  {phase.phase_code}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{phase.phase_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {phase.percentage_fee}% - {phase.deliverables.length} livrables
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total HT</span>
            <span className="text-xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
            <span>TVA (20%)</span>
            <span>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total * 0.2)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between items-center text-primary">
            <span className="font-semibold">Total TTC</span>
            <span className="text-xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total * 1.2)}
            </span>
          </div>
        </div>

        {/* Validity */}
        {document.validity_days && (
          <div className="text-center text-xs text-muted-foreground">
            Offre valable {document.validity_days} jours
          </div>
        )}
      </CardContent>
    </Card>
  );
}
