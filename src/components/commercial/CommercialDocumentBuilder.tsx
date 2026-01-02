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
import { PhaseSelector } from './PhaseSelector';
import { FeeCalculator } from './FeeCalculator';
import { TermsEditor } from './TermsEditor';
import {
  CommercialDocument,
  CommercialDocumentPhase,
  DocumentType,
  ProjectType,
  FeeMode,
  DOCUMENT_TYPE_LABELS,
  PROJECT_TYPE_LABELS,
  FEE_MODE_LABELS,
  PHASES_BY_PROJECT_TYPE
} from '@/lib/commercialTypes';
import { DEFAULT_CLAUSES_BY_PROJECT_TYPE } from '@/lib/defaultContractClauses';

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

  // Initialize phases when project type changes
  useEffect(() => {
    if (isNew && phases.length === 0 && document.project_type) {
      const templatePhases = PHASES_BY_PROJECT_TYPE[document.project_type];
      const initialPhases: CommercialDocumentPhase[] = templatePhases.map((p, index) => ({
        id: `temp-${index}`,
        document_id: documentId || '',
        phase_code: p.code,
        phase_name: p.name,
        phase_description: p.description,
        percentage_fee: p.defaultPercentage,
        amount: 0,
        is_included: true,
        deliverables: p.deliverables,
        sort_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      onPhasesChange(initialPhases);
    }
  }, [document.project_type, isNew]);

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

  const handleProjectTypeChange = (projectType: ProjectType) => {
    // Reset phases when project type changes
    const templatePhases = PHASES_BY_PROJECT_TYPE[projectType];
    const newPhases: CommercialDocumentPhase[] = templatePhases.map((p, index) => ({
      id: `temp-${index}`,
      document_id: documentId || '',
      phase_code: p.code,
      phase_name: p.name,
      phase_description: p.description,
      percentage_fee: p.defaultPercentage,
      amount: 0,
      is_included: true,
      deliverables: p.deliverables,
      sort_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const clauses = DEFAULT_CLAUSES_BY_PROJECT_TYPE[projectType];
    
    onDocumentChange({
      ...document,
      project_type: projectType,
      general_conditions: clauses.general_conditions,
      payment_terms: clauses.payment_terms
    });
    onPhasesChange(newPhases);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general">Général</TabsTrigger>
        <TabsTrigger value="phases">Phases & Mission</TabsTrigger>
        <TabsTrigger value="fees">Honoraires</TabsTrigger>
        <TabsTrigger value="terms">Conditions</TabsTrigger>
      </TabsList>

      {/* General Tab */}
      <TabsContent value="general" className="space-y-6">
        {/* Document Type */}
        <Card>
          <CardHeader>
            <CardTitle>Type de document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {(['quote', 'contract', 'proposal'] as DocumentType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onDocumentChange({ ...document, document_type: type })}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    document.document_type === type 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{DOCUMENT_TYPE_LABELS[type]}</div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Titre du document</Label>
              <Input
                value={document.title || ''}
                onChange={(e) => onDocumentChange({ ...document, title: e.target.value })}
                placeholder={`Titre du ${DOCUMENT_TYPE_LABELS[document.document_type || 'quote'].toLowerCase()}`}
              />
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
          </CardContent>
        </Card>

        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientSelector
              selectedCompanyId={document.client_company_id}
              selectedContactId={document.client_contact_id}
              onCompanyChange={(id) => onDocumentChange({ ...document, client_company_id: id })}
              onContactChange={(id) => onDocumentChange({ ...document, client_contact_id: id })}
            />
          </CardContent>
        </Card>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Surface (m²)</Label>
                <Input
                  type="number"
                  value={document.project_surface || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_surface: parseFloat(e.target.value) || undefined })}
                  placeholder="Surface en m²"
                />
              </div>
              <div className="space-y-2">
                <Label>Budget travaux (€)</Label>
                <Input
                  type="number"
                  value={document.project_budget || ''}
                  onChange={(e) => onDocumentChange({ ...document, project_budget: parseFloat(e.target.value) || undefined })}
                  placeholder="Budget prévisionnel"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Phases Tab */}
      <TabsContent value="phases" className="space-y-6">
        <PhaseSelector
          phases={phases}
          projectType={document.project_type || 'interior'}
          onPhasesChange={onPhasesChange}
          projectBudget={document.project_budget}
          feePercentage={document.fee_percentage}
          totalAmount={document.total_amount}
          document={document}
          onDocumentChange={onDocumentChange}
          documentId={documentId}
        />
      </TabsContent>

      {/* Fees Tab */}
      <TabsContent value="fees" className="space-y-6">
        <FeeCalculator
          document={document}
          phases={phases}
          onDocumentChange={onDocumentChange}
        />
      </TabsContent>

      {/* Terms Tab */}
      <TabsContent value="terms" className="space-y-6">
        <TermsEditor
          document={document}
          onDocumentChange={onDocumentChange}
        />
      </TabsContent>
    </Tabs>
  );
}
