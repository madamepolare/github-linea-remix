import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, User, MapPin, Ruler, Euro, FileText, FolderKanban, Link2 } from 'lucide-react';
import { QuoteDocument, DOCUMENT_TYPE_LABELS } from '@/types/quoteTypes';
import { useContractTypes, ContractType } from '@/hooks/useContractTypes';
import { useProjects } from '@/hooks/useProjects';
import { ClientSelector } from '../ClientSelector';
import { getProjectTypeFromCode } from '@/lib/projectTypeMapping';

interface QuoteGeneralTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  linkedProjectId?: string;
  onLinkedProjectChange?: (projectId: string | undefined) => void;
}

export function QuoteGeneralTab({ document, onDocumentChange, linkedProjectId, onLinkedProjectChange }: QuoteGeneralTabProps) {
  const { activeContractTypes, isLoading: isLoadingTypes } = useContractTypes();
  const { projects, isLoading: isLoadingProjects } = useProjects();

  // Get current contract type
  const currentContractType = activeContractTypes.find(t => t.id === document.contract_type_id);
  const fields = currentContractType?.default_fields || {};

  // When contract type changes, update project_type using centralized mapping
  const handleContractTypeChange = (typeId: string) => {
    const contractType = activeContractTypes.find(t => t.id === typeId);
    // Use centralized mapping for consistent project_type
    const mappedProjectType = getProjectTypeFromCode(contractType?.code);
    
    onDocumentChange({
      ...document,
      contract_type_id: typeId,
      contract_type: contractType,
      project_type: mappedProjectType
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Document Type & Contract Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Type de document</Label>
          <Select
            value={document.document_type || 'quote'}
            onValueChange={(v) => onDocumentChange({ ...document, document_type: v as any })}
          >
            <SelectTrigger className="h-9 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Type de contrat</Label>
          <Select
            value={document.contract_type_id || ''}
            onValueChange={handleContractTypeChange}
          >
            <SelectTrigger className="h-9 sm:h-10">
              <SelectValue placeholder="Sélectionner un type..." />
            </SelectTrigger>
            <SelectContent>
              {activeContractTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="truncate">{type.name}</span>
                    <Badge variant="outline" className="ml-1 text-xs shrink-0 hidden sm:inline-flex">
                      {type.code}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Link to existing project (Avenant) */}
      {onLinkedProjectChange && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Rattacher à un projet existant
            </CardTitle>
            <CardDescription>
              Transforme ce devis en avenant d'un projet existant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={linkedProjectId || 'none'}
              onValueChange={(v) => onLinkedProjectChange(v === 'none' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun projet lié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun (nouveau projet)</SelectItem>
                {projects?.filter(p => !p.is_archived).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span>{project.name}</span>
                      {project.crm_company?.name && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          {project.crm_company.name}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedProjectId && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                Ce devis sera enregistré comme avenant au projet sélectionné
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Selection */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <ClientSelector
            selectedCompanyId={document.client_company_id}
            selectedContactId={document.client_contact_id}
            onCompanyChange={(id) => onDocumentChange({ ...document, client_company_id: id })}
            onContactChange={(id) => onDocumentChange({ ...document, client_contact_id: id })}
          />
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          <div className="space-y-2">
            <Label className="text-sm">Titre du projet</Label>
            <Input
              value={document.title || ''}
              onChange={(e) => onDocumentChange({ ...document, title: e.target.value })}
              placeholder="Ex: Rénovation appartement Paris 16e"
              className="h-9 sm:h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Description</Label>
            <Textarea
              value={document.description || ''}
              onChange={(e) => onDocumentChange({ ...document, description: e.target.value })}
              placeholder="Description du projet..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Dynamic fields based on contract type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {fields.address && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Adresse
                </Label>
                <Input
                  value={document.project_address || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_address: e.target.value })}
                  placeholder="Adresse du projet"
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {fields.city && (
              <div className="space-y-2">
                <Label className="text-sm">Ville</Label>
                <Input
                  value={document.project_city || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_city: e.target.value })}
                  placeholder="Ville"
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {fields.surface && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Surface (m²)
                </Label>
                <Input
                  type="number"
                  value={document.project_surface || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_surface: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {fields.budget && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                  Budget global
                </Label>
                <Input
                  type="number"
                  value={document.project_budget || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_budget: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {fields.construction_budget && (
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                  Budget travaux (base honoraires)
                </Label>
                <Input
                  type="number"
                  value={document.construction_budget || ''}
                  onChange={(e) => onDocumentChange({ ...document, construction_budget: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  className="h-9 sm:h-10"
                />
                {document.construction_budget && document.fee_percentage && (
                  <p className="text-xs text-muted-foreground">
                    Honoraires estimés : {formatCurrency(document.construction_budget * (document.fee_percentage / 100))}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee Mode - Only show if construction_budget field is active */}
      {fields.construction_budget && (
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Mode de calcul des honoraires
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Mode</Label>
                <Select
                  value={document.fee_mode || 'fixed'}
                  onValueChange={(v) => onDocumentChange({ ...document, fee_mode: v as any })}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Forfait fixe</SelectItem>
                    <SelectItem value="percentage">% du budget</SelectItem>
                    <SelectItem value="hourly">Taux horaire</SelectItem>
                    <SelectItem value="mixed">Mixte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {document.fee_mode === 'percentage' && (
                <div className="space-y-2">
                  <Label className="text-sm">Pourcentage (%)</Label>
                  <Input
                    type="number"
                    value={document.fee_percentage || ''}
                    onChange={(e) => onDocumentChange({ ...document, fee_percentage: parseFloat(e.target.value) || undefined })}
                    placeholder="12"
                    step="0.5"
                    className="h-9 sm:h-10"
                  />
                </div>
              )}

              {document.fee_mode === 'hourly' && (
                <div className="space-y-2">
                  <Label className="text-sm">Taux horaire (€)</Label>
                  <Input
                    type="number"
                    value={document.hourly_rate || ''}
                    onChange={(e) => onDocumentChange({ ...document, hourly_rate: parseFloat(e.target.value) || undefined })}
                    placeholder="85"
                    className="h-9 sm:h-10"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
