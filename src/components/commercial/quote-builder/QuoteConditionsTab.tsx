import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, 
  RotateCcw,
  Info,
  Sparkles,
  FolderOpen,
  Trash2
} from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';
import { ContractType } from '@/hooks/useContractTypes';
import {
  UnifiedContractConditions,
  parseConditionsFromDocument,
  getDefaultConditionsForType,
  mergeWithDefaults,
  serializeConditions,
  getClauseLabel,
  getTemplateDisplayName
} from '@/lib/contractConditionsUnified';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface QuoteConditionsTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  contractTypeConfig?: ContractType;
  isLocked?: boolean;
}

export function QuoteConditionsTab({ 
  document, 
  onDocumentChange,
  contractTypeConfig,
  isLocked = false 
}: QuoteConditionsTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Parse existing conditions or get defaults
  const conditions = useMemo<UnifiedContractConditions>(() => {
    const parsed = parseConditionsFromDocument(document.general_conditions || null);
    const defaults = getDefaultConditionsForType(contractTypeConfig?.code);
    
    if (contractTypeConfig?.default_clauses) {
      const typeDefaults = parseConditionsFromDocument(
        typeof contractTypeConfig.default_clauses === 'string' 
          ? contractTypeConfig.default_clauses 
          : JSON.stringify(contractTypeConfig.default_clauses)
      );
      if (typeDefaults) {
        return mergeWithDefaults(parsed, mergeWithDefaults(typeDefaults, defaults));
      }
    }
    
    return mergeWithDefaults(parsed, defaults);
  }, [document.general_conditions, contractTypeConfig]);

  // Sync changes to document
  const syncToDocument = useCallback((updatedConditions: UnifiedContractConditions) => {
    onDocumentChange({
      ...document,
      general_conditions: serializeConditions(updatedConditions)
    });
  }, [document, onDocumentChange]);

  // Clause handlers
  const updateClause = useCallback((key: string, value: string) => {
    const updated: UnifiedContractConditions = {
      ...conditions,
      clauses: { ...conditions.clauses, [key]: value }
    };
    syncToDocument(updated);
  }, [conditions, syncToDocument]);

  // Delete a specific clause
  const deleteClause = useCallback((key: string) => {
    const { [key]: _, ...remainingClauses } = conditions.clauses;
    const updated: UnifiedContractConditions = {
      ...conditions,
      clauses: remainingClauses
    };
    syncToDocument(updated);
    toast.success('Clause supprimée');
  }, [conditions, syncToDocument]);

  // Clear all clauses
  const clearAllClauses = useCallback(() => {
    const updated: UnifiedContractConditions = {
      ...conditions,
      clauses: {}
    };
    syncToDocument(updated);
    toast.success('Toutes les clauses ont été supprimées');
  }, [conditions, syncToDocument]);

  // Load from template
  const loadFromTemplate = useCallback((templateType: 'architecture' | 'communication' | 'generic') => {
    let defaults: UnifiedContractConditions;
    switch (templateType) {
      case 'architecture':
        defaults = getDefaultConditionsForType('ARCHI');
        break;
      case 'communication':
        defaults = getDefaultConditionsForType('CAMP360');
        break;
      default:
        defaults = getDefaultConditionsForType(undefined);
    }
    syncToDocument(defaults);
    toast.success(`Conditions "${getTemplateDisplayName(defaults.template)}" chargées`);
  }, [syncToDocument]);

  // Generate with AI (placeholder)
  const generateWithAI = useCallback(async () => {
    setIsGenerating(true);
    toast.info('Génération des conditions avec l\'IA...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const code = contractTypeConfig?.code || '';
    const defaults = getDefaultConditionsForType(code);
    syncToDocument(defaults);
    
    setIsGenerating(false);
    toast.success('Conditions générées');
  }, [contractTypeConfig?.code, syncToDocument]);

  // Load default text for a specific clause
  const loadDefaultClause = useCallback((key: string) => {
    const defaults = getDefaultConditionsForType(contractTypeConfig?.code);
    if (defaults.clauses[key]) {
      updateClause(key, defaults.clauses[key]);
    }
  }, [contractTypeConfig?.code, updateClause]);

  // Get clause keys that exist in current conditions
  const clauseKeys = Object.keys(conditions.clauses);

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getTemplateDisplayName(conditions.template)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                Précharger
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => loadFromTemplate('architecture')}>
                <FileText className="h-4 w-4 mr-2" />
                Template Architecture / MOE
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadFromTemplate('communication')}>
                <FileText className="h-4 w-4 mr-2" />
                Template Communication
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadFromTemplate('generic')}>
                <FileText className="h-4 w-4 mr-2" />
                Template Générique
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1.5"
            onClick={generateWithAI}
            disabled={isGenerating}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? 'Génération...' : 'Générer avec IA'}
          </Button>
        </div>
      </div>

      {/* Clauses Accordion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Clauses contractuelles</CardTitle>
            {clauseKeys.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                onClick={clearAllClauses}
              >
                <Trash2 className="h-3 w-3" />
                Tout effacer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {clauseKeys.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune clause configurée.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => loadFromTemplate(contractTypeConfig?.code ? 
                  (contractTypeConfig.code.includes('ARCH') ? 'architecture' : 'communication') 
                  : 'generic'
                )}
              >
                Charger les clauses par défaut
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-1">
              {clauseKeys.map((key) => {
                const label = getClauseLabel(key);
                const value = conditions.clauses[key] || '';
                
                return (
                  <AccordionItem 
                    key={key} 
                    value={key}
                    className="border rounded-md px-3"
                  >
                    <AccordionTrigger className="hover:no-underline py-2 text-sm">
                      <span className="font-medium">{label.label}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3">
                      <Textarea
                        value={value}
                        onChange={(e) => updateClause(key, e.target.value)}
                        rows={4}
                        className="text-sm"
                        placeholder={`Texte de la clause...`}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => deleteClause(key)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Supprimer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => loadDefaultClause(key)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Défaut
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Special conditions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Conditions particulières</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={document.special_conditions || ''}
            onChange={(e) => onDocumentChange({ ...document, special_conditions: e.target.value })}
            placeholder="Conditions spécifiques à ce document..."
            rows={4}
            className="text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}
