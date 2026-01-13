import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientSelector } from './ClientSelector';
import { FeesAndQuoteEditor } from './FeesAndQuoteEditor';
import { TermsEditor } from './TermsEditor';
import { MOEClausesEditor } from './MOEClausesEditor';
import { ConstructionBudgetField } from './ConstructionBudgetField';
import {
  CommercialDocument,
  CommercialDocumentPhase,
  DocumentType,
  ProjectType,
  DOCUMENT_TYPE_LABELS,
  PROJECT_TYPE_LABELS
} from '@/lib/commercialTypes';
import { QuoteLineItem } from '@/lib/quoteTemplates';
import { DEFAULT_CLAUSES_BY_PROJECT_TYPE } from '@/lib/defaultContractClauses';
import { usePhaseTemplates } from '@/hooks/usePhaseTemplates';

interface CommercialDocumentBuilderProps {
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
  onPhasesChange: (phases: CommercialDocumentPhase[]) => void;
  isNew: boolean;
  documentId?: string;
}

export function CommercialDocumentBuilder({
  document,
  phases,
  onDocumentChange,
  onPhasesChange,
  isNew,
  documentId
}: CommercialDocumentBuilderProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
  
  // Generate document title from document number, project name and client
  const generateDocumentTitle = (docNumber: string, projectName: string, clientName?: string) => {
    const parts = [docNumber, projectName];
    if (clientName) parts.push(clientName);
    return parts.filter(Boolean).join('_');
  };
  
  // Fetch phase templates from database
  const { templates: phaseTemplates, initializeDefaultsIfEmpty } = usePhaseTemplates(document.project_type);

  // Convert phases to quote items
  const phasesToItems = (phases: CommercialDocumentPhase[]): QuoteLineItem[] => {
    return phases.map(phase => ({
      id: phase.id,
      type: 'phase' as const,
      code: phase.phase_code,
      designation: phase.phase_name,
      description: phase.phase_description || undefined,
      quantity: 1,
      unit: 'forfait',
      unitPrice: phase.amount || 0,
      amount: phase.amount || 0,
      isOptional: !phase.is_included,
      deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
      sortOrder: phase.sort_order || 0,
      percentageFee: phase.percentage_fee || 15
    }));
  };

  // Convert quote items back to phases (with calculated amounts)
  const itemsToPhases = (items: QuoteLineItem[]): CommercialDocumentPhase[] => {
    const phaseItems = items.filter(item => item.type === 'phase');
    const includedPhases = phaseItems.filter(p => !p.isOptional);
    const totalPercentage = includedPhases.reduce((sum, i) => sum + (i.percentageFee || 0), 0);
    
    // Calculate base amount for phases
    const constructionBudget = document.construction_budget || 0;
    const feePercentage = document.fee_percentage || 0;
    const feeMode = document.fee_mode || 'fixed';
    
    let phaseBaseAmount = document.total_amount || 0;
    if (feeMode === 'percentage' && constructionBudget > 0 && feePercentage > 0) {
      phaseBaseAmount = constructionBudget * (feePercentage / 100);
    }

    return phaseItems.map((item, index) => {
      // Calculate amount from percentage
      let calculatedAmount = item.amount;
      if (item.percentageFee && totalPercentage > 0 && phaseBaseAmount > 0 && !item.isOptional) {
        calculatedAmount = (item.percentageFee / totalPercentage) * phaseBaseAmount;
      }
      
      return {
        id: item.id,
        document_id: documentId || '',
        phase_code: item.code || '',
        phase_name: item.designation,
        phase_description: item.description,
        percentage_fee: item.percentageFee || 15,
        amount: calculatedAmount,
        is_included: !item.isOptional,
        deliverables: item.deliverables,
        sort_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  };

  // Initialize quote items from phases
  useEffect(() => {
    if (phases.length > 0 && quoteItems.length === 0) {
      setQuoteItems(phasesToItems(phases));
    }
  }, [phases]);

  // Handle quote items change
  const handleQuoteItemsChange = (items: QuoteLineItem[]) => {
    setQuoteItems(items);
    // Update phases from items (with calculated amounts)
    const newPhases = itemsToPhases(items);
    onPhasesChange(newPhases);
    
    // Calculate total from phases amounts
    const phasesTotal = newPhases
      .filter(p => p.is_included)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Add non-phase items
    const otherTotal = items
      .filter(i => i.type !== 'phase' && !i.isOptional && i.type !== 'discount')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const discount = items
      .filter(i => i.type === 'discount')
      .reduce((sum, i) => sum + Math.abs(i.amount), 0);
    
    const total = phasesTotal + otherTotal - discount;
    onDocumentChange({ ...document, total_amount: total });
  };

  // Initialize defaults for current project type
  useEffect(() => {
    if (document.project_type) {
      initializeDefaultsIfEmpty.mutate(document.project_type);
    }
  }, [document.project_type]);

  // Phases are NOT auto-loaded - user must explicitly add them from settings via the "+ Phase" menu

  // Load default clauses when project type changes
  useEffect(() => {
    if (isNew && document.project_type && !document.general_conditions) {
      const clauses = DEFAULT_CLAUSES_BY_PROJECT_TYPE[document.project_type];
      onDocumentChange({
        ...document,
        general_conditions: clauses.general_conditions,
        payment_terms: clauses.payment_terms
      });
    }
  }, [document.project_type, isNew]);

  const handleProjectTypeChange = async (projectType: ProjectType) => {
    // Initialize defaults for the new project type
    await initializeDefaultsIfEmpty.mutateAsync(projectType);
    
    // Clear phases - they will be loaded from settings when user adds them
    onPhasesChange([]);
    setQuoteItems([]);
    
    const clauses = DEFAULT_CLAUSES_BY_PROJECT_TYPE[projectType];
    
    onDocumentChange({
      ...document,
      project_type: projectType,
      general_conditions: clauses.general_conditions,
      payment_terms: clauses.payment_terms
    });
  };

  const handleRestoreVersion = (doc: Partial<CommercialDocument>, restoredPhases: CommercialDocumentPhase[]) => {
    onDocumentChange(doc);
    onPhasesChange(restoredPhases);
    setQuoteItems(phasesToItems(restoredPhases));
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="general" className="text-xs sm:text-sm py-2">Général</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm py-2">Honoraires</TabsTrigger>
          <TabsTrigger value="terms" className="text-xs sm:text-sm py-2">Conditions</TabsTrigger>
        </TabsList>

      {/* General Tab */}
      <TabsContent value="general" className="space-y-4 sm:space-y-6">
        {/* Document Type */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Type de document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {(['quote', 'contract', 'proposal'] as DocumentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onDocumentChange({ ...document, document_type: type })}
                  className={`p-3 sm:p-4 rounded-lg border-2 text-center transition-colors ${
                    document.document_type === type 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm sm:text-base">{DOCUMENT_TYPE_LABELS[type]}</div>
                </button>
              ))}
            </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSelector
                selectedCompanyId={document.client_company_id}
                selectedContactId={document.client_contact_id}
                onCompanyChange={(id, companyName) => {
                  const newDoc = { ...document, client_company_id: id };
                  // Auto-generate title if we have a project name
                  if (document.title && companyName) {
                    const projectName = document.description?.split('\n')[0] || document.title;
                    newDoc.title = generateDocumentTitle(document.document_number || '', projectName, companyName);
                  }
                  onDocumentChange(newDoc);
                }}
                onContactChange={(id) => onDocumentChange({ ...document, client_contact_id: id })}
              />
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du projet / Titre du devis</Label>
                <Input
                  value={document.title || ''}
                  onChange={(e) => onDocumentChange({ ...document, title: e.target.value })}
                  placeholder="Ex: Rénovation appartement Haussmann"
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom sera utilisé comme titre du document et du futur projet
                </p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={document.description || ''}
                  onChange={(e) => onDocumentChange({ ...document, description: e.target.value })}
                  placeholder="Description du projet et de la mission..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Type de projet</Label>
              <Select 
                value={document.project_type} 
                onValueChange={(v) => handleProjectTypeChange(v as ProjectType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['interior', 'architecture', 'scenography'] as ProjectType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROJECT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={document.project_address || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_address: e.target.value })}
                  placeholder="Adresse du projet"
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={document.project_city || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_city: e.target.value })}
                  placeholder="Ville"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Surface (m²)</Label>
              <Input
                type="number"
                value={document.project_surface || ''}
                onChange={(e) => onDocumentChange({ ...document, project_surface: parseFloat(e.target.value) || undefined })}
                placeholder="Surface en m²"
              />
            </div>
          </CardContent>
        </Card>

        {/* Construction Budget */}
        <ConstructionBudgetField
          constructionBudget={document.construction_budget}
          constructionBudgetDisclosed={document.construction_budget_disclosed ?? true}
          onChange={(budget, disclosed) => onDocumentChange({
            ...document,
            construction_budget: budget ?? undefined,
            construction_budget_disclosed: disclosed
          })}
        />
      </TabsContent>

      {/* Fees Tab - Combined Fees + Quote */}
      <TabsContent value="fees" className="space-y-4 sm:space-y-6">
        <FeesAndQuoteEditor
          items={quoteItems}
          projectType={document.project_type || 'interior'}
          onItemsChange={handleQuoteItemsChange}
          document={document}
          onDocumentChange={onDocumentChange}
          documentId={documentId}
        />
      </TabsContent>

      {/* Terms Tab */}
      <TabsContent value="terms" className="space-y-4 sm:space-y-6">
        {document.project_type === 'architecture' ? (
          <MOEClausesEditor
            document={document}
            phases={phases}
            onDocumentChange={onDocumentChange}
            onPhasesChange={onPhasesChange}
          />
        ) : (
          <TermsEditor
            document={document}
            onDocumentChange={onDocumentChange}
          />
        )}
      </TabsContent>
    </Tabs>
    </div>
  );
}
