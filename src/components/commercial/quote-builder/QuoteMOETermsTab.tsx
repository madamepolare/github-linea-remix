// MOE Terms Editor for Architecture Contracts in QuoteBuilder
// Provides editable clauses, payment schedule, and settings

import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';
import { 
  getDefaultMOEConfig, 
  MOEDefaultConfig,
  parseDocumentMOEConfig,
  mergeMOEConfig
} from '@/lib/moeContractDefaults';
import { MOEPaymentSchedule, DEFAULT_MOE_CLAUSES } from '@/lib/moeContractConfig';

interface QuoteMOETermsTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  contractTypeConfig?: any;
}

export function QuoteMOETermsTab({ 
  document, 
  onDocumentChange,
  contractTypeConfig 
}: QuoteMOETermsTabProps) {
  // Parse existing config from document or use defaults
  const [moeConfig, setMoeConfig] = useState<MOEDefaultConfig>(() => {
    const existing = parseDocumentMOEConfig(document.general_conditions || null);
    if (existing) {
      return mergeMOEConfig(existing);
    }
    if (contractTypeConfig?.default_clauses) {
      return mergeMOEConfig(contractTypeConfig.default_clauses);
    }
    return getDefaultMOEConfig();
  });

  const [activeTab, setActiveTab] = useState('clauses');

  // Sync config to document whenever it changes
  const syncToDocument = useCallback((config: MOEDefaultConfig) => {
    onDocumentChange({
      general_conditions: JSON.stringify(config)
    });
  }, [onDocumentChange]);

  // Update clause
  const updateClause = (key: string, value: string) => {
    const updated = {
      ...moeConfig,
      clauses: { ...moeConfig.clauses, [key]: value }
    };
    setMoeConfig(updated);
    syncToDocument(updated);
  };

  // Update payment schedule
  const updatePaymentSchedule = (index: number, field: keyof MOEPaymentSchedule, value: string | number) => {
    const updated = {
      ...moeConfig,
      payment_schedule: moeConfig.payment_schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    };
    setMoeConfig(updated);
    syncToDocument(updated);
  };

  // Add payment schedule item
  const addPaymentScheduleItem = () => {
    const updated = {
      ...moeConfig,
      payment_schedule: [
        ...moeConfig.payment_schedule,
        { stage: 'Nouvelle étape', percentage: 0, description: '' }
      ]
    };
    setMoeConfig(updated);
    syncToDocument(updated);
  };

  // Remove payment schedule item
  const removePaymentScheduleItem = (index: number) => {
    const updated = {
      ...moeConfig,
      payment_schedule: moeConfig.payment_schedule.filter((_, i) => i !== index)
    };
    setMoeConfig(updated);
    syncToDocument(updated);
  };

  // Update settings
  const updateSetting = (key: keyof MOEDefaultConfig['settings'], value: string | number) => {
    const updated = {
      ...moeConfig,
      settings: { ...moeConfig.settings, [key]: value }
    };
    setMoeConfig(updated);
    syncToDocument(updated);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaults = getDefaultMOEConfig();
    setMoeConfig(defaults);
    syncToDocument(defaults);
  };

  // Load default text for a specific clause
  const loadDefaultClause = (key: string) => {
    const defaultValue = DEFAULT_MOE_CLAUSES[key as keyof typeof DEFAULT_MOE_CLAUSES];
    if (defaultValue) {
      updateClause(key, defaultValue);
    }
  };

  // Calculate total percentage
  const totalPercentage = moeConfig.payment_schedule.reduce((sum, item) => sum + (item.percentage || 0), 0);

  // Clause definitions for display
  const clauseDefinitions = [
    { key: 'responsabilite', label: 'Responsabilité de l\'Architecte' },
    { key: 'references_tiers', label: 'Références aux règlements et tiers spécialisés' },
    { key: 'limitation_responsabilite', label: 'Limitation de responsabilité' },
    { key: 'modification_avenant', label: 'Modification de la mission et avenants' },
    { key: 'obligations_moe', label: 'Obligations du Maître d\'œuvre' },
    { key: 'obligations_moa', label: 'Obligations du Maître d\'ouvrage' },
    { key: 'imprevus', label: 'Imprévus' },
    { key: 'suspension', label: 'Suspension des prestations' },
    { key: 'resiliation', label: 'Résiliation du contrat' },
    { key: 'litiges', label: 'Litiges et conciliation préalable' },
    { key: 'delais_validation', label: 'Délais de validation' },
    { key: 'honoraires_nota', label: 'Note sur les honoraires' },
    { key: 'reunion_supplementaire', label: 'Réunions supplémentaires' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with reset button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conditions du contrat MOE</h3>
          <p className="text-sm text-muted-foreground">
            Clauses, échéancier et paramètres modifiables pour ce document
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetToDefaults}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clauses">Clauses</TabsTrigger>
          <TabsTrigger value="echeancier">Échéancier</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres</TabsTrigger>
        </TabsList>

        {/* CLAUSES TAB */}
        <TabsContent value="clauses" className="space-y-4 pt-4">
          <Accordion type="multiple" className="w-full">
            {clauseDefinitions.map((clause) => (
              <AccordionItem key={clause.key} value={clause.key}>
                <AccordionTrigger className="text-sm font-medium">
                  {clause.label}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                  <Textarea
                    value={moeConfig.clauses[clause.key] || ''}
                    onChange={(e) => updateClause(clause.key, e.target.value)}
                    rows={6}
                    className="text-sm"
                    placeholder={`Texte de la clause "${clause.label}"...`}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => loadDefaultClause(clause.key)}
                    className="text-xs"
                  >
                    Charger le texte par défaut
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Special conditions */}
          <div className="space-y-2 pt-4 border-t">
            <Label>Conditions particulières</Label>
            <Textarea
              value={document.special_conditions || ''}
              onChange={(e) => onDocumentChange({ special_conditions: e.target.value })}
              rows={4}
              placeholder="Conditions particulières spécifiques à ce contrat..."
            />
          </div>
        </TabsContent>

        {/* PAYMENT SCHEDULE TAB */}
        <TabsContent value="echeancier" className="space-y-4 pt-4">
          <div className="space-y-3">
            {moeConfig.payment_schedule.map((item, index) => (
              <div 
                key={index} 
                className="grid grid-cols-12 gap-2 items-center p-3 bg-muted/30 rounded-lg"
              >
                <div className="col-span-5">
                  <Input
                    value={item.stage}
                    onChange={(e) => updatePaymentSchedule(index, 'stage', e.target.value)}
                    placeholder="Étape"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={item.description || ''}
                    onChange={(e) => updatePaymentSchedule(index, 'description', e.target.value)}
                    placeholder="Description (optionnel)"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.percentage}
                      onChange={(e) => updatePaymentSchedule(index, 'percentage', parseFloat(e.target.value) || 0)}
                      className="pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaymentScheduleItem(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={addPaymentScheduleItem}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter une étape
          </Button>

          {/* Total indicator */}
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            totalPercentage === 100 
              ? 'bg-green-500/10 text-green-700' 
              : 'bg-amber-500/10 text-amber-700'
          }`}>
            {totalPercentage !== 100 && <AlertCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">
              Total : {totalPercentage}%
              {totalPercentage !== 100 && ' (doit être égal à 100%)'}
            </span>
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="parametres" className="space-y-6 pt-4">
          {/* Fees */}
          <div className="space-y-4">
            <h4 className="font-medium">Honoraires par défaut</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum de facturation (€ HT)</Label>
                <Input
                  type="number"
                  value={moeConfig.settings.minimum_fee}
                  onChange={(e) => updateSetting('minimum_fee', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tarif réunion supplémentaire (€ HT)</Label>
                <Input
                  type="number"
                  value={moeConfig.settings.extra_meeting_rate}
                  onChange={(e) => updateSetting('extra_meeting_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Assurance</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Compagnie d'assurance</Label>
                <Input
                  value={moeConfig.settings.insurance_company}
                  onChange={(e) => updateSetting('insurance_company', e.target.value)}
                  placeholder="Nom de la compagnie"
                />
              </div>
              <div className="space-y-2">
                <Label>N° de police</Label>
                <Input
                  value={moeConfig.settings.insurance_policy_number}
                  onChange={(e) => updateSetting('insurance_policy_number', e.target.value)}
                  placeholder="Numéro de police"
                />
              </div>
            </div>
          </div>

          {/* Validity */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Validité du document</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée de validité (jours)</Label>
                <Input
                  type="number"
                  value={document.validity_days || 30}
                  onChange={(e) => onDocumentChange({ validity_days: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
