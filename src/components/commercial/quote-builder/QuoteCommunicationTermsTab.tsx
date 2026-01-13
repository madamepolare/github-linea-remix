// Terms Editor for Communication Contracts in QuoteBuilder
// Provides editable clauses, payment schedule, and settings for communication agencies

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
  getDefaultCommunicationConfig,
  CommunicationContractConfig,
  parseCommunicationConfig,
  DEFAULT_COMMUNICATION_CLAUSES
} from '@/lib/communicationContractDefaults';
import { MOEPaymentSchedule } from '@/lib/moeContractConfig';

interface QuoteCommunicationTermsTabProps {
  document: Partial<QuoteDocument>;
  onDocumentChange: (doc: Partial<QuoteDocument>) => void;
  contractTypeConfig?: any;
}

export function QuoteCommunicationTermsTab({ 
  document, 
  onDocumentChange,
  contractTypeConfig 
}: QuoteCommunicationTermsTabProps) {
  // Parse existing config from document or use defaults
  const [config, setConfig] = useState<CommunicationContractConfig>(() => {
    const existing = parseCommunicationConfig(document.general_conditions || null);
    if (existing) {
      return { ...getDefaultCommunicationConfig(), ...existing };
    }
    if (contractTypeConfig?.default_clauses?.template === 'communication_contract') {
      return { ...getDefaultCommunicationConfig(), ...contractTypeConfig.default_clauses };
    }
    return getDefaultCommunicationConfig();
  });

  const [activeTab, setActiveTab] = useState('clauses');

  // Sync config to document whenever it changes
  const syncToDocument = useCallback((newConfig: CommunicationContractConfig) => {
    onDocumentChange({
      general_conditions: JSON.stringify(newConfig)
    });
  }, [onDocumentChange]);

  // Update clause
  const updateClause = (key: string, value: string) => {
    const updated = {
      ...config,
      clauses: { ...config.clauses, [key]: value }
    };
    setConfig(updated);
    syncToDocument(updated);
  };

  // Update payment schedule
  const updatePaymentSchedule = (index: number, field: keyof MOEPaymentSchedule, value: string | number) => {
    const updated = {
      ...config,
      payment_schedule: config.payment_schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    };
    setConfig(updated);
    syncToDocument(updated);
  };

  // Add payment schedule item
  const addPaymentScheduleItem = () => {
    const updated = {
      ...config,
      payment_schedule: [
        ...config.payment_schedule,
        { stage: 'Nouvelle étape', percentage: 0, description: '' }
      ]
    };
    setConfig(updated);
    syncToDocument(updated);
  };

  // Remove payment schedule item
  const removePaymentScheduleItem = (index: number) => {
    const updated = {
      ...config,
      payment_schedule: config.payment_schedule.filter((_, i) => i !== index)
    };
    setConfig(updated);
    syncToDocument(updated);
  };

  // Update settings
  const updateSetting = (key: keyof CommunicationContractConfig['settings'], value: string | number) => {
    const updated = {
      ...config,
      settings: { ...config.settings, [key]: value }
    };
    setConfig(updated);
    syncToDocument(updated);
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaults = getDefaultCommunicationConfig();
    setConfig(defaults);
    syncToDocument(defaults);
  };

  // Load default text for a specific clause
  const loadDefaultClause = (key: string) => {
    const defaultValue = DEFAULT_COMMUNICATION_CLAUSES[key as keyof typeof DEFAULT_COMMUNICATION_CLAUSES];
    if (defaultValue) {
      updateClause(key, defaultValue);
    }
  };

  // Calculate total percentage
  const totalPercentage = config.payment_schedule.reduce((sum, item) => sum + (item.percentage || 0), 0);

  // Clause definitions for display
  const clauseDefinitions = [
    { key: 'objet', label: 'Objet du contrat' },
    { key: 'propriete_intellectuelle', label: 'Propriété intellectuelle' },
    { key: 'cession_droits', label: 'Cession de droits' },
    { key: 'confidentialite', label: 'Confidentialité' },
    { key: 'validation', label: 'Processus de validation' },
    { key: 'modifications', label: 'Modifications' },
    { key: 'delais', label: 'Délais' },
    { key: 'responsabilite', label: 'Responsabilité' },
    { key: 'sous_traitance', label: 'Sous-traitance' },
    { key: 'facturation', label: 'Facturation et paiement' },
    { key: 'resiliation', label: 'Résiliation' },
    { key: 'litiges', label: 'Litiges' },
    { key: 'references', label: 'Droit de référence' },
    { key: 'rgpd', label: 'RGPD / Données personnelles' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with reset button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conditions du contrat</h3>
          <p className="text-sm text-muted-foreground">
            Clauses, échéancier et paramètres pour les prestations de communication
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
                    value={config.clauses[clause.key] || ''}
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
            {config.payment_schedule.map((item, index) => (
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
          {/* Rates */}
          <div className="space-y-4">
            <h4 className="font-medium">Tarifs par défaut</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taux journalier (€ HT)</Label>
                <Input
                  type="number"
                  value={config.settings.daily_rate}
                  onChange={(e) => updateSetting('daily_rate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Minimum de facturation (€ HT)</Label>
                <Input
                  type="number"
                  value={config.settings.minimum_project}
                  onChange={(e) => updateSetting('minimum_project', parseFloat(e.target.value) || 0)}
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

          {/* Payment terms */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Conditions de paiement</h4>
            <Textarea
              value={document.payment_terms || 'Paiement à 30 jours date de facture.'}
              onChange={(e) => onDocumentChange({ payment_terms: e.target.value })}
              rows={3}
              placeholder="Conditions de paiement..."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
