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

interface DocumentPreviewPanelProps {
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  total: number;
}

export function DocumentPreviewPanel({
  document,
  phases,
  total
}: DocumentPreviewPanelProps) {
  const includedPhases = phases.filter(p => p.is_included);

  return (
    <Card className="sticky top-6">
      <CardHeader className="bg-muted/50">
        <div className="text-center space-y-2">
          <Badge>{DOCUMENT_TYPE_LABELS[document.document_type || 'quote']}</Badge>
          <CardTitle className="text-xl">
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
