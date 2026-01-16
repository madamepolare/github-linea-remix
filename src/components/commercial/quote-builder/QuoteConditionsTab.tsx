import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, 
  Plus, 
  Trash2, 
  RotateCcw,
  Info,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';
import { ContractType } from '@/hooks/useContractTypes';
import {
  UnifiedContractConditions,
  UnifiedPaymentScheduleItem,
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
}

export function QuoteConditionsTab({ 
  document, 
  onDocumentChange,
  contractTypeConfig 
}: QuoteConditionsTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Parse existing conditions or get defaults
  const conditions = useMemo<UnifiedContractConditions>(() => {
    const parsed = parseConditionsFromDocument(document.general_conditions || null);
    const defaults = getDefaultConditionsForType(contractTypeConfig?.code);
    
    // If contract type has its own default_clauses, use those as base
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

  // Payment schedule handlers
  const updatePaymentSchedule = useCallback((index: number, field: keyof UnifiedPaymentScheduleItem, value: string | number) => {
    const updated = [...conditions.payment_schedule];
    updated[index] = { ...updated[index], [field]: value };
    syncToDocument({ ...conditions, payment_schedule: updated });
  }, [conditions, syncToDocument]);

  const addPaymentScheduleItem = useCallback(() => {
    const updated: UnifiedContractConditions = {
      ...conditions,
      payment_schedule: [
        ...conditions.payment_schedule,
        { stage: 'Nouvelle étape', description: '', percentage: 0 }
      ]
    };
    syncToDocument(updated);
  }, [conditions, syncToDocument]);

  const removePaymentScheduleItem = useCallback((index: number) => {
    const updated: UnifiedContractConditions = {
      ...conditions,
      payment_schedule: conditions.payment_schedule.filter((_, i) => i !== index)
    };
    syncToDocument(updated);
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
    
    // Simulate AI generation - in real implementation, call AI endpoint
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For now, just load appropriate defaults based on project description
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

  // Calculate total percentage
  const totalPercentage = conditions.payment_schedule.reduce((sum, item) => sum + (item.percentage || 0), 0);
  
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

      {/* Payment Schedule - Simple inline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Échéancier de paiement</CardTitle>
            <Badge 
              variant={totalPercentage === 100 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {totalPercentage === 100 ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {totalPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {conditions.payment_schedule.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
            >
              <Input
                value={item.stage}
                onChange={(e) => updatePaymentSchedule(index, 'stage', e.target.value)}
                placeholder="Étape"
                className="h-8 text-sm flex-1"
              />
              <Input
                value={item.description}
                onChange={(e) => updatePaymentSchedule(index, 'description', e.target.value)}
                placeholder="Description..."
                className="h-8 text-sm flex-[2]"
              />
              <Input
                type="number"
                value={item.percentage}
                onChange={(e) => updatePaymentSchedule(index, 'percentage', parseFloat(e.target.value) || 0)}
                min={0}
                max={100}
                className="h-8 text-sm w-16 text-center"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                onClick={() => removePaymentScheduleItem(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs gap-1.5 border border-dashed"
            onClick={addPaymentScheduleItem}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </CardContent>
      </Card>

      {/* Clauses Accordion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Clauses contractuelles</CardTitle>
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
                      <div className="flex items-center justify-end mt-2">
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

      {/* Special conditions & Payment terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conditions particulières</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={document.special_conditions || ''}
              onChange={(e) => onDocumentChange({ ...document, special_conditions: e.target.value })}
              placeholder="Conditions spécifiques à ce document..."
              rows={3}
              className="text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Modalités de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={document.payment_terms || ''}
              onChange={(e) => onDocumentChange({ ...document, payment_terms: e.target.value })}
              placeholder="Ex: Paiement à 30 jours..."
              rows={3}
              className="text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
