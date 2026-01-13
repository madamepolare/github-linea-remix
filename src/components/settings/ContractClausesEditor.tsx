// Contract Clauses Editor for Settings
// Allows editing default clauses per contract type

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, FileText, Scale, Save } from 'lucide-react';
import { DEFAULT_MOE_CLAUSES } from '@/lib/moeContractConfig';
import { DEFAULT_COMMUNICATION_CLAUSES } from '@/lib/communicationContractDefaults';

interface ClausesConfig {
  template?: string;
  clauses?: Record<string, string>;
  [key: string]: unknown;
}

interface ContractClausesEditorProps {
  contractCode: string;
  defaultClauses: ClausesConfig;
  onChange: (clauses: ClausesConfig) => void;
}

// Clause labels for MOE contracts
const MOE_CLAUSE_LABELS: Record<string, string> = {
  responsabilite: 'Responsabilité de l\'Architecte',
  references_tiers: 'Références et tiers spécialisés',
  limitation_responsabilite: 'Limitation de responsabilité',
  modification_avenant: 'Modifications et avenants',
  obligations_moe: 'Obligations du Maître d\'œuvre',
  obligations_moa: 'Obligations du Maître d\'ouvrage',
  imprevus: 'Imprévus',
  suspension: 'Suspension des prestations',
  resiliation: 'Résiliation du contrat',
  litiges: 'Litiges et conciliation',
  delais_validation: 'Délais de validation',
  honoraires_nota: 'Note sur les honoraires',
  reunion_supplementaire: 'Réunions supplémentaires'
};

// Clause labels for Communication contracts
const COMMUNICATION_CLAUSE_LABELS: Record<string, string> = {
  propriete_intellectuelle: 'Propriété intellectuelle',
  droits_cession: 'Droits de cession',
  confidentialite: 'Confidentialité',
  modifications: 'Modifications et révisions',
  delais_validation: 'Délais de validation',
  resiliation: 'Résiliation',
  litiges: 'Litiges',
  responsabilite: 'Responsabilité'
};

// Determine if a contract code is MOE-based
const isMOEContract = (code: string) => ['MOE', 'ARCHI', 'INTERIOR', 'SCENO'].includes(code);
const isCommunicationContract = (code: string) => ['CAMP360', 'BRAND', 'DIGITAL', 'EVENT', 'VIDEO', 'ACCORD', 'PUB', 'COM'].includes(code);

export function ContractClausesEditor({ 
  contractCode, 
  defaultClauses, 
  onChange 
}: ContractClausesEditorProps) {
  // Parse clauses from config
  const [clauses, setClauses] = useState<Record<string, string>>(() => {
    if (defaultClauses?.clauses && typeof defaultClauses.clauses === 'object') {
      return defaultClauses.clauses as Record<string, string>;
    }
    // Return appropriate defaults based on contract type
    if (isMOEContract(contractCode)) {
      return DEFAULT_MOE_CLAUSES;
    }
    if (isCommunicationContract(contractCode)) {
      return DEFAULT_COMMUNICATION_CLAUSES;
    }
    return {};
  });

  // Get appropriate labels
  const clauseLabels = isMOEContract(contractCode) 
    ? MOE_CLAUSE_LABELS 
    : isCommunicationContract(contractCode) 
      ? COMMUNICATION_CLAUSE_LABELS 
      : {};

  // Get default clauses for reset
  const getDefaultClauses = () => {
    if (isMOEContract(contractCode)) return DEFAULT_MOE_CLAUSES;
    if (isCommunicationContract(contractCode)) return DEFAULT_COMMUNICATION_CLAUSES;
    return {};
  };

  const updateClause = (key: string, value: string) => {
    const newClauses = { ...clauses, [key]: value };
    setClauses(newClauses);
    onChange({
      ...defaultClauses,
      clauses: newClauses
    });
  };

  const resetToDefaults = () => {
    const defaults = getDefaultClauses();
    setClauses(defaults);
    onChange({
      ...defaultClauses,
      clauses: defaults
    });
  };

  const loadDefaultForClause = (key: string) => {
    const defaults = getDefaultClauses();
    if (defaults[key]) {
      updateClause(key, defaults[key]);
    }
  };

  // Get all clause keys (from labels or current clauses)
  const allClauseKeys = Object.keys(clauseLabels).length > 0 
    ? Object.keys(clauseLabels) 
    : Object.keys(clauses);

  if (allClauseKeys.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Ce type de contrat n'a pas de clauses prédéfinies.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Les clauses seront configurables directement dans le document.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Clauses par défaut
          </h4>
          <p className="text-sm text-muted-foreground">
            Ces clauses seront utilisées par défaut pour tous les nouveaux documents de ce type
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser tout
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Accordion type="multiple" className="w-full">
            {allClauseKeys.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {clauseLabels[key] || key}
                    {clauses[key] && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        Personnalisé
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Textarea
                      value={clauses[key] || ''}
                      onChange={(e) => updateClause(key, e.target.value)}
                      placeholder={`Texte de la clause "${clauseLabels[key] || key}"...`}
                      rows={6}
                      className="text-sm"
                    />
                    <div className="flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => loadDefaultForClause(key)}
                      >
                        Charger le texte par défaut
                      </Button>
                      {clauses[key] && (
                        <span className="text-xs text-muted-foreground">
                          {clauses[key].length} caractères
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
