import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, 
  Calendar, 
  Settings, 
  Plus, 
  Trash2, 
  RotateCcw,
  Info,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';
import { ContractType } from '@/hooks/useContractTypes';
import { cn } from '@/lib/utils';
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
  const [activeTab, setActiveTab] = useState<'clauses' | 'echeancier' | 'parametres'>('clauses');
  
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

  // Settings handlers
  const updateSetting = useCallback((key: string, value: unknown) => {
    const updated: UnifiedContractConditions = {
      ...conditions,
      settings: { ...conditions.settings, [key]: value }
    };
    syncToDocument(updated);
  }, [conditions, syncToDocument]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaults = getDefaultConditionsForType(contractTypeConfig?.code);
    syncToDocument(defaults);
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
    <div className="space-y-4">
      {/* Header with template info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {getTemplateDisplayName(conditions.template)}
          </Badge>
          <span className="text-xs text-muted-foreground">v{conditions.version}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={resetToDefaults} className="h-8 text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="clauses" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Clauses
          </TabsTrigger>
          <TabsTrigger value="echeancier" className="text-xs gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Échéancier
          </TabsTrigger>
          <TabsTrigger value="parametres" className="text-xs gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Clauses Tab */}
        <TabsContent value="clauses" className="space-y-4 mt-4">
          {clauseKeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune clause configurée pour ce type de contrat.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={resetToDefaults}
                >
                  Charger les clauses par défaut
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {clauseKeys.map((key) => {
                const label = getClauseLabel(key);
                const value = conditions.clauses[key] || '';
                
                return (
                  <AccordionItem 
                    key={key} 
                    value={key}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-left">
                        <span className="font-medium text-sm">{label.label}</span>
                        {label.description && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            — {label.description}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-2">
                        <Textarea
                          value={value}
                          onChange={(e) => updateClause(key, e.target.value)}
                          rows={6}
                          className="text-sm"
                          placeholder={`Texte de la clause "${label.label}"...`}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{value.length} caractères</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => loadDefaultClause(key)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Texte par défaut
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Special conditions field */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Conditions particulières
              </CardTitle>
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
        </TabsContent>

        {/* Payment Schedule Tab */}
        <TabsContent value="echeancier" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Échéancier de paiement</CardTitle>
                <div className="flex items-center gap-2">
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
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {conditions.payment_schedule.map((item, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg"
                >
                  <div className="col-span-12 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Étape</Label>
                    <Input
                      value={item.stage}
                      onChange={(e) => updatePaymentSchedule(index, 'stage', e.target.value)}
                      placeholder="Nom de l'étape"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-8 sm:col-span-6 space-y-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updatePaymentSchedule(index, 'description', e.target.value)}
                      placeholder="Description..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">%</Label>
                    <Input
                      type="number"
                      value={item.percentage}
                      onChange={(e) => updatePaymentSchedule(index, 'percentage', parseFloat(e.target.value) || 0)}
                      min={0}
                      max={100}
                      className="h-8 text-sm text-center"
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-end pb-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removePaymentScheduleItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs gap-1.5 border-dashed"
                onClick={addPaymentScheduleItem}
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une étape
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="parametres" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Common settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Validité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Durée de validité (jours)</Label>
                  <Input
                    type="number"
                    value={conditions.settings.validity_days || 30}
                    onChange={(e) => updateSetting('validity_days', parseInt(e.target.value) || 30)}
                    min={1}
                    className="h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fee settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Honoraires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(conditions.template === 'moe_architecture' || conditions.template === 'moe_architecture_contract') && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Honoraires minimum (€)</Label>
                      <Input
                        type="number"
                        value={conditions.settings.minimum_fee || 4000}
                        onChange={(e) => updateSetting('minimum_fee', parseFloat(e.target.value) || 0)}
                        min={0}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Réunion supplémentaire (€/réunion)</Label>
                      <Input
                        type="number"
                        value={conditions.settings.extra_meeting_rate || 250}
                        onChange={(e) => updateSetting('extra_meeting_rate', parseFloat(e.target.value) || 0)}
                        min={0}
                        className="h-9"
                      />
                    </div>
                  </>
                )}

                {(conditions.template === 'communication' || conditions.template === 'communication_contract') && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Taux journalier (€/jour)</Label>
                      <Input
                        type="number"
                        value={conditions.settings.daily_rate || 800}
                        onChange={(e) => updateSetting('daily_rate', parseFloat(e.target.value) || 0)}
                        min={0}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Projet minimum (€)</Label>
                      <Input
                        type="number"
                        value={conditions.settings.minimum_fee || 5000}
                        onChange={(e) => updateSetting('minimum_fee', parseFloat(e.target.value) || 0)}
                        min={0}
                        className="h-9"
                      />
                    </div>
                  </>
                )}

                {conditions.template === 'generic' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Honoraires minimum (€)</Label>
                    <Input
                      type="number"
                      value={conditions.settings.minimum_fee || 0}
                      onChange={(e) => updateSetting('minimum_fee', parseFloat(e.target.value) || 0)}
                      min={0}
                      className="h-9"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance settings (architecture only) */}
            {(conditions.template === 'moe_architecture' || conditions.template === 'moe_architecture_contract') && (
              <Card className="sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Assurances</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Compagnie d'assurance</Label>
                      <Input
                        value={conditions.settings.insurance_company || ''}
                        onChange={(e) => updateSetting('insurance_company', e.target.value)}
                        placeholder="Nom de la compagnie"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">N° de police</Label>
                      <Input
                        value={conditions.settings.insurance_policy_number || ''}
                        onChange={(e) => updateSetting('insurance_policy_number', e.target.value)}
                        placeholder="Numéro de police"
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment terms text */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conditions de paiement (texte)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={document.payment_terms || ''}
                onChange={(e) => onDocumentChange({ ...document, payment_terms: e.target.value })}
                placeholder="Ex: Paiement à 30 jours date de facture..."
                rows={3}
                className="text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
