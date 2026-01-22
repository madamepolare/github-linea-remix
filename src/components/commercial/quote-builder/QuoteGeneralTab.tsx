import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, User, MapPin, Ruler, Euro, FileText, FolderKanban, Link2, CalendarIcon, UserCircle, Receipt, Landmark, FileEdit } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { isArchitectureContractType } from '@/lib/moeContractDefaults';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { QuoteDocument } from '@/types/quoteTypes';
import { useContractTypes } from '@/hooks/useContractTypes';
import { useProjects } from '@/hooks/useProjects';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useContacts } from '@/hooks/useContacts';
import { useCommercialDocuments } from '@/hooks/useCommercialDocuments';
import { useCRMCompanies } from '@/hooks/useCRMCompanies';
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
  const { data: members } = useTeamMembers();
  const { contacts } = useContacts();
  const { documents: commercialDocuments } = useCommercialDocuments();
  const { companies } = useCRMCompanies();

  // Get current contract type
  const currentContractType = activeContractTypes.find(t => t.id === document.contract_type_id);
  const fields = currentContractType?.default_fields || {};

  // Determine if this is an architecture/scenography type (for showing location/surface)
  // Strict detection: only show location/surface when contract type is explicitly architecture
  const isArchitectureType = currentContractType?.code 
    ? isArchitectureContractType(currentContractType.code)
    : false;

  // Filter contacts for billing contact (only those linked to the selected company)
  const billingContacts = contacts?.filter(c => 
    !document.client_company_id || c.crm_company_id === document.client_company_id
  ) || [];

  // When contract type changes, update project_type using centralized mapping
  const handleContractTypeChange = (typeId: string) => {
    const contractType = activeContractTypes.find(t => t.id === typeId);
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
    <div className="space-y-4">
      {/* Type de contrat + Description projet */}
      <section className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Type & Description</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1">
              Type de contrat
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={document.contract_type_id || ''}
              onValueChange={handleContractTypeChange}
            >
              <SelectTrigger className={cn("h-9 sm:h-10", !document.contract_type_id && "border-destructive/50")}>
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

          <div className="space-y-2">
            <Label className="text-sm">Description du projet</Label>
            <Textarea
              value={document.description || ''}
              onChange={(e) => onDocumentChange({ ...document, description: e.target.value })}
              placeholder="Décrivez brièvement le projet, son contexte et ses enjeux..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      </section>

      {/* Avenant toggle */}
      {onLinkedProjectChange && (
        <section className="rounded-lg border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Avenant</h3>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_amendment"
                checked={document.is_amendment || false}
                onCheckedChange={(checked) => {
                  onDocumentChange({ ...document, is_amendment: checked });
                  if (!checked) {
                    onLinkedProjectChange(undefined);
                  }
                }}
              />
              <Label htmlFor="is_amendment" className="text-sm cursor-pointer">
                Ce document est un avenant
              </Label>
            </div>
          </div>
          
          {document.is_amendment && (
            <div className="p-4 space-y-3">
              <Label className="flex items-center gap-2 text-sm">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                Rattacher à un projet existant
              </Label>
              <Select
                value={linkedProjectId || 'none'}
                onValueChange={(v) => {
                  const newProjectId = v === 'none' ? undefined : v;
                  onLinkedProjectChange(newProjectId);
                  
                  if (newProjectId) {
                    const selectedProject = projects?.find(p => p.id === newProjectId);
                    if (selectedProject) {
                      const updates: Partial<QuoteDocument> = { ...document };
                      
                      if (selectedProject.crm_company_id) {
                        updates.client_company_id = selectedProject.crm_company_id;
                        
                        const projectDocs = commercialDocuments?.filter(d => d.project?.id === newProjectId);
                        const latestDoc = projectDocs?.sort((a, b) => 
                          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                        )[0];
                        
                        if (latestDoc) {
                          if (latestDoc.client_contact?.id) {
                            updates.client_contact_id = latestDoc.client_contact.id;
                          }
                          if (latestDoc.billing_contact?.id) {
                            updates.billing_contact_id = latestDoc.billing_contact.id;
                          }
                        } else {
                          const company = companies?.find(c => c.id === selectedProject.crm_company_id);
                          if (company?.primary_contact?.id) {
                            updates.client_contact_id = company.primary_contact.id;
                          }
                          if (company?.billing_contact_id) {
                            updates.billing_contact_id = company.billing_contact_id;
                          }
                        }
                      }
                      
                      if (selectedProject.address) {
                        updates.project_address = selectedProject.address;
                      }
                      if (selectedProject.city) {
                        updates.project_city = selectedProject.city;
                      }
                      if (selectedProject.surface) {
                        updates.project_surface = selectedProject.surface;
                      }
                      if (selectedProject.budget) {
                        updates.project_budget = selectedProject.budget;
                      }
                      
                      onDocumentChange(updates);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun projet lié</SelectItem>
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  Ce devis sera enregistré comme avenant au projet sélectionné
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Client & Facturation */}
      <section className={cn("rounded-lg border bg-card", !document.client_company_id && "border-destructive/30")}>
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Client & Facturation</h3>
          <span className="text-destructive text-sm">*</span>
        </div>
        <div className="p-4 space-y-4">
          <ClientSelector
            selectedCompanyId={document.client_company_id}
            selectedContactId={document.client_contact_id}
            onCompanyChange={(id, companyName, billingInfo) => {
              onDocumentChange({ 
                ...document, 
                client_company_id: id,
                reference_client: billingInfo?.client_reference || document.reference_client
              });
            }}
            onContactChange={(id) => onDocumentChange({ ...document, client_contact_id: id })}
          />
          
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t">
            <div className="flex items-center gap-3">
              <Switch
                id="is_public_market"
                checked={document.is_public_market || false}
                onCheckedChange={(checked) => onDocumentChange({ ...document, is_public_market: checked })}
              />
              <Label htmlFor="is_public_market" className="flex items-center gap-2 text-sm cursor-pointer">
                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                Marché public
              </Label>
            </div>
            
            {document.is_public_market && (
              <div className="flex-1">
                <Input
                  value={document.market_reference || ''}
                  onChange={(e) => onDocumentChange({ ...document, market_reference: e.target.value })}
                  placeholder="N° Réf Marché"
                  className="h-9"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2 pt-3 border-t">
            <Label className="flex items-center gap-2 text-sm">
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              Contact facturation
            </Label>
            <Select
              value={document.billing_contact_id || ''}
              onValueChange={(v) =>
                onDocumentChange({
                  ...document,
                  billing_contact_id: v === '__same_as_primary__' ? undefined : v,
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Même que contact principal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__same_as_primary__">Même que contact principal</SelectItem>
                {billingContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{contact.name}</span>
                      {contact.email && (
                        <span className="text-xs text-muted-foreground">({contact.email})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Responsable interne */}
      <section className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Responsable interne</h3>
        </div>
        <div className="p-4">
          <Select
            value={document.internal_owner_id || ''}
            onValueChange={(v) => onDocumentChange({ ...document, internal_owner_id: v || undefined })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choisir un responsable..." />
            </SelectTrigger>
            <SelectContent>
              {members?.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span>{member.profile?.full_name || 'Sans nom'}</span>
                    {member.profile?.job_title && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {member.profile.job_title}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Project Details - Only for architecture/scenography types */}
      {isArchitectureType && (
        <section className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Localisation & Surface</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.address !== false && (
                <div className="space-y-2">
                  <Label className="text-sm">Adresse</Label>
                  <Input
                    value={document.project_address || ''}
                    onChange={(e) => onDocumentChange({ ...document, project_address: e.target.value })}
                    placeholder="Adresse du projet"
                    className="h-9"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm">Code postal</Label>
                  <Input
                    value={document.postal_code || ''}
                    onChange={(e) => onDocumentChange({ ...document, postal_code: e.target.value })}
                    placeholder="75001"
                    className="h-9"
                  />
                </div>
                {fields.city !== false && (
                  <div className="space-y-2">
                    <Label className="text-sm">Ville</Label>
                    <Input
                      value={document.project_city || ''}
                      onChange={(e) => onDocumentChange({ ...document, project_city: e.target.value })}
                      placeholder="Ville"
                      className="h-9"
                    />
                  </div>
                )}
              </div>

              {fields.surface !== false && (
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
                    className="h-9"
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
                    className="h-9"
                  />
                </div>
              )}
            </div>

            {fields.construction_budget && (
              <div className="space-y-2 pt-3 border-t">
                <Label className="flex items-center gap-2 text-sm">
                  <Euro className="h-3.5 w-3.5 text-muted-foreground" />
                  Budget travaux (base honoraires)
                </Label>
                <Input
                  type="number"
                  value={document.construction_budget || ''}
                  onChange={(e) => onDocumentChange({ ...document, construction_budget: parseFloat(e.target.value) || undefined })}
                  placeholder="0"
                  className="h-9"
                />
                {document.construction_budget && document.fee_percentage && (
                  <p className="text-xs text-muted-foreground">
                    Honoraires estimés : {formatCurrency(document.construction_budget * (document.fee_percentage / 100))}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dates prévisionnelles */}
      <section className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Dates prévisionnelles</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Date signature attendue</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal",
                      !document.expected_signature_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {document.expected_signature_date
                      ? format(new Date(document.expected_signature_date), 'dd MMM yyyy', { locale: fr })
                      : 'Sélectionner...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={document.expected_signature_date ? new Date(document.expected_signature_date) : undefined}
                    onSelect={(date) => onDocumentChange({ 
                      ...document, 
                      expected_signature_date: date?.toISOString().split('T')[0] 
                    })}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Date début projet</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal",
                      !document.expected_start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {document.expected_start_date
                      ? format(new Date(document.expected_start_date), 'dd MMM yyyy', { locale: fr })
                      : 'Sélectionner...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={document.expected_start_date ? new Date(document.expected_start_date) : undefined}
                    onSelect={(date) => onDocumentChange({ 
                      ...document, 
                      expected_start_date: date?.toISOString().split('T')[0] 
                    })}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Date fin projet</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal",
                      !document.expected_end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {document.expected_end_date
                      ? format(new Date(document.expected_end_date), 'dd MMM yyyy', { locale: fr })
                      : 'Sélectionner...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={document.expected_end_date ? new Date(document.expected_end_date) : undefined}
                    onSelect={(date) => onDocumentChange({ 
                      ...document, 
                      expected_end_date: date?.toISOString().split('T')[0] 
                    })}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </section>

      {/* Fee Mode - Only show if construction_budget field is active */}
      {fields.construction_budget && (
        <section className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Mode de calcul des honoraires</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Mode</Label>
                <Select
                  value={document.fee_mode || 'fixed'}
                  onValueChange={(v) => onDocumentChange({ ...document, fee_mode: v as any })}
                >
                  <SelectTrigger className="h-9">
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
                    className="h-9"
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
                    className="h-9"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
