// Contract Clauses Editor for Settings
// Allows editing default clauses per contract type

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, FileText, Scale, Save, AlertCircle, Check, Loader2 } from 'lucide-react';
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

// Clause labels for MOE contracts (Architecture)
const MOE_CLAUSE_LABELS: Record<string, { label: string; description: string }> = {
  responsabilite: { 
    label: 'Responsabilité de l\'Architecte', 
    description: 'Définit le périmètre de responsabilité de l\'architecte' 
  },
  references_tiers: { 
    label: 'Références et tiers spécialisés', 
    description: 'Recours aux bureaux d\'études et spécialistes' 
  },
  limitation_responsabilite: { 
    label: 'Limitation de responsabilité', 
    description: 'Cas d\'exclusion de responsabilité' 
  },
  modification_avenant: { 
    label: 'Modifications et avenants', 
    description: 'Procédure de modification du contrat' 
  },
  obligations_moe: { 
    label: 'Obligations du Maître d\'œuvre', 
    description: 'Engagements de l\'architecte' 
  },
  obligations_moa: { 
    label: 'Obligations du Maître d\'ouvrage', 
    description: 'Engagements du client' 
  },
  imprevus: { 
    label: 'Imprévus et aléas', 
    description: 'Gestion des aléas de chantier' 
  },
  suspension: { 
    label: 'Suspension des prestations', 
    description: 'Conditions de suspension du contrat' 
  },
  resiliation: { 
    label: 'Résiliation du contrat', 
    description: 'Conditions de résiliation et indemnités' 
  },
  litiges: { 
    label: 'Litiges et conciliation', 
    description: 'Procédure de règlement des différends' 
  },
  delais_validation: { 
    label: 'Délais de validation', 
    description: 'Délais accordés pour les validations client' 
  },
  honoraires_nota: { 
    label: 'Note sur les honoraires', 
    description: 'Minima de facturation et frais annexes' 
  },
  reunion_supplementaire: { 
    label: 'Réunions supplémentaires', 
    description: 'Tarification des réunions hors forfait' 
  }
};

// Clause labels for Communication contracts
const COMMUNICATION_CLAUSE_LABELS: Record<string, { label: string; description: string }> = {
  objet: { 
    label: 'Objet du contrat', 
    description: 'Définition du périmètre de la mission' 
  },
  propriete_intellectuelle: { 
    label: 'Propriété intellectuelle', 
    description: 'Droits sur les créations avant et après paiement' 
  },
  cession_droits: { 
    label: 'Cession de droits', 
    description: 'Modalités de cession des droits d\'exploitation' 
  },
  confidentialite: { 
    label: 'Confidentialité', 
    description: 'Obligations de confidentialité des parties' 
  },
  validation: { 
    label: 'Processus de validation', 
    description: 'Modalités de validation des livrables' 
  },
  modifications: { 
    label: 'Modifications et révisions', 
    description: 'Gestion des demandes de modification' 
  },
  delais: { 
    label: 'Délais', 
    description: 'Engagements sur les délais de livraison' 
  },
  responsabilite: { 
    label: 'Responsabilité', 
    description: 'Limitation de responsabilité de l\'agence' 
  },
  sous_traitance: { 
    label: 'Sous-traitance', 
    description: 'Conditions de recours à la sous-traitance' 
  },
  facturation: { 
    label: 'Facturation et paiement', 
    description: 'Modalités de facturation et pénalités' 
  },
  resiliation: { 
    label: 'Résiliation', 
    description: 'Conditions de résiliation anticipée' 
  },
  litiges: { 
    label: 'Litiges', 
    description: 'Procédure de règlement des différends' 
  },
  references: { 
    label: 'Références', 
    description: 'Autorisation d\'utilisation en référence' 
  },
  rgpd: { 
    label: 'RGPD', 
    description: 'Protection des données personnelles' 
  }
};

// Determine if a contract code is MOE-based
const isMOEContract = (code: string) => ['MOE', 'ARCHI', 'INTERIOR'].includes(code?.toUpperCase());
const isCommunicationContract = (code: string) => ['CAMP360', 'BRAND', 'DIGITAL', 'EVENT', 'VIDEO', 'ACCORD', 'PUB', 'COM'].includes(code?.toUpperCase());
const isScenographieContract = (code: string) => ['SCENO', 'EXPO', 'MUSEUM'].includes(code?.toUpperCase());

export function ContractClausesEditor({ 
  contractCode, 
  defaultClauses, 
  onChange 
}: ContractClausesEditorProps) {
  const [hasChanges, setHasChanges] = useState(false);
  
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
    // Scénographie uses MOE clauses as base
    if (isScenographieContract(contractCode)) {
      return DEFAULT_MOE_CLAUSES;
    }
    return {};
  });

  // Get appropriate labels based on contract type
  const getClauseLabels = () => {
    if (isMOEContract(contractCode) || isScenographieContract(contractCode)) {
      return MOE_CLAUSE_LABELS;
    }
    if (isCommunicationContract(contractCode)) {
      return COMMUNICATION_CLAUSE_LABELS;
    }
    return {};
  };

  const clauseLabels = getClauseLabels();

  // Get default clauses for reset
  const getDefaultClauses = () => {
    if (isMOEContract(contractCode) || isScenographieContract(contractCode)) {
      return DEFAULT_MOE_CLAUSES;
    }
    if (isCommunicationContract(contractCode)) {
      return DEFAULT_COMMUNICATION_CLAUSES;
    }
    return {};
  };

  const updateClause = (key: string, value: string) => {
    const newClauses = { ...clauses, [key]: value };
    setClauses(newClauses);
    setHasChanges(true);
    onChange({
      ...defaultClauses,
      clauses: newClauses
    });
  };

  const resetToDefaults = () => {
    const defaults = getDefaultClauses();
    setClauses(defaults);
    setHasChanges(true);
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

  const initializeAllClauses = () => {
    const defaults = getDefaultClauses();
    const mergedClauses = { ...defaults, ...clauses };
    setClauses(mergedClauses);
    setHasChanges(true);
    onChange({
      ...defaultClauses,
      clauses: mergedClauses
    });
  };

  // Get all clause keys (from labels or current clauses)
  const allClauseKeys = Object.keys(clauseLabels).length > 0 
    ? Object.keys(clauseLabels) 
    : Object.keys(clauses);

  // Check if clauses are properly initialized
  const clausesCount = Object.keys(clauses).filter(k => clauses[k] && clauses[k].length > 0).length;
  const expectedClausesCount = Object.keys(clauseLabels).length;
  const needsInitialization = clausesCount < expectedClausesCount * 0.5; // Less than 50% populated

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
            {hasChanges && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                Non enregistré
              </Badge>
            )}
          </h4>
          <p className="text-sm text-muted-foreground">
            Ces clauses seront utilisées par défaut pour tous les nouveaux documents de ce type
          </p>
        </div>
        <div className="flex items-center gap-2">
          {needsInitialization && (
            <Button variant="default" size="sm" onClick={initializeAllClauses}>
              <FileText className="h-4 w-4 mr-2" />
              Charger toutes les clauses
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {needsInitialization && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Les clauses ne sont pas encore initialisées pour ce type de contrat. 
            Cliquez sur "Charger toutes les clauses" pour les pré-remplir avec les textes par défaut.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardDescription>
              {clausesCount} / {expectedClausesCount} clauses configurées
            </CardDescription>
            <Badge variant={clausesCount === expectedClausesCount ? "default" : "secondary"}>
              {clausesCount === expectedClausesCount ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Complet
                </>
              ) : (
                `${Math.round((clausesCount / expectedClausesCount) * 100)}%`
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="multiple" className="w-full">
            {allClauseKeys.map((key) => {
              const labelConfig = clauseLabels[key];
              const hasContent = clauses[key] && clauses[key].length > 0;
              
              return (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-left">
                      <div className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                      <div className="flex flex-col items-start">
                        <span>{labelConfig?.label || key}</span>
                        {labelConfig?.description && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {labelConfig.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <Textarea
                        value={clauses[key] || ''}
                        onChange={(e) => updateClause(key, e.target.value)}
                        placeholder={`Texte de la clause "${labelConfig?.label || key}"...`}
                        rows={8}
                        className="text-sm font-mono"
                      />
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => loadDefaultForClause(key)}
                        >
                          <RotateCcw className="h-3 w-3 mr-2" />
                          Charger le texte par défaut
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {clauses[key]?.length || 0} caractères
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
