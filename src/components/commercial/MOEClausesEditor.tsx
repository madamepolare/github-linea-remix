import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Layers,
  CreditCard,
  Scale,
  Settings2,
  FileText,
  RotateCcw
} from 'lucide-react';
import { 
  DEFAULT_MOE_MISSION_PHASES, 
  DEFAULT_MOE_PAYMENT_SCHEDULE, 
  DEFAULT_MOE_CLAUSES,
  MOEMissionPhase,
  MOEPaymentSchedule
} from '@/lib/moeContractConfig';
import { useMOEContractConfig } from '@/hooks/useMOEContractConfig';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { CommercialDocument, CommercialDocumentPhase } from '@/lib/commercialTypes';

interface MOEClausesEditorProps {
  document: Partial<CommercialDocument>;
  phases: CommercialDocumentPhase[];
  onDocumentChange: (doc: Partial<CommercialDocument>) => void;
  onPhasesChange: (phases: CommercialDocumentPhase[]) => void;
}

const CLAUSE_LABELS: Record<string, string> = {
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
  honoraires_nota: 'Note sur les honoraires'
};

export function MOEClausesEditor({
  document,
  phases,
  onDocumentChange,
  onPhasesChange
}: MOEClausesEditorProps) {
  const { config } = useMOEContractConfig();
  
  // Parse existing clauses from general_conditions or use defaults
  const [clauses, setClauses] = useState<Record<string, string>>(() => {
    try {
      const existing = document.general_conditions ? JSON.parse(document.general_conditions) : null;
      if (existing && typeof existing === 'object' && existing.clauses) {
        return existing.clauses;
      }
    } catch {}
    return config?.clauses || DEFAULT_MOE_CLAUSES;
  });

  const [paymentSchedule, setPaymentSchedule] = useState<MOEPaymentSchedule[]>(() => {
    try {
      const existing = document.payment_terms ? JSON.parse(document.payment_terms) : null;
      if (Array.isArray(existing)) {
        return existing;
      }
    } catch {}
    return config?.payment_schedule || DEFAULT_MOE_PAYMENT_SCHEDULE;
  });

  const [minimumFee, setMinimumFee] = useState(config?.minimum_fee || 4000);
  const [extraMeetingRate, setExtraMeetingRate] = useState(config?.extra_meeting_rate || 250);
  const [insuranceCompany, setInsuranceCompany] = useState(config?.insurance_company || 'MAF');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(config?.insurance_policy_number || '');

  // Sync clauses to document
  useEffect(() => {
    const moeData = {
      clauses,
      minimum_fee: minimumFee,
      extra_meeting_rate: extraMeetingRate,
      insurance_company: insuranceCompany,
      insurance_policy_number: insurancePolicyNumber
    };
    onDocumentChange({
      ...document,
      general_conditions: JSON.stringify(moeData),
      payment_terms: JSON.stringify(paymentSchedule)
    });
  }, [clauses, paymentSchedule, minimumFee, extraMeetingRate, insuranceCompany, insurancePolicyNumber]);

  // Load defaults from config when available
  useEffect(() => {
    if (config) {
      // Only set if not already customized
      if (!document.general_conditions) {
        setClauses(config.clauses);
      }
      if (!document.payment_terms) {
        setPaymentSchedule(config.payment_schedule);
      }
      setMinimumFee(config.minimum_fee || 4000);
      setExtraMeetingRate(config.extra_meeting_rate || 250);
      if (config.insurance_company) setInsuranceCompany(config.insurance_company);
      if (config.insurance_policy_number) setInsurancePolicyNumber(config.insurance_policy_number);
    }
  }, [config]);

  const updateClause = (key: string, value: string) => {
    setClauses(prev => ({ ...prev, [key]: value }));
  };

  const updatePaymentItem = (index: number, updates: Partial<MOEPaymentSchedule>) => {
    const newSchedule = [...paymentSchedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    setPaymentSchedule(newSchedule);
  };

  const addPaymentItem = () => {
    setPaymentSchedule([...paymentSchedule, { stage: 'Nouvelle étape', percentage: 0 }]);
  };

  const removePaymentItem = (index: number) => {
    setPaymentSchedule(paymentSchedule.filter((_, i) => i !== index));
  };

  const totalPercentage = paymentSchedule.reduce((sum, item) => sum + item.percentage, 0);

  const resetToDefaults = () => {
    setClauses(config?.clauses || DEFAULT_MOE_CLAUSES);
    setPaymentSchedule(config?.payment_schedule || DEFAULT_MOE_PAYMENT_SCHEDULE);
    setMinimumFee(config?.minimum_fee || 4000);
    setExtraMeetingRate(config?.extra_meeting_rate || 250);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Clauses & Conditions MOE
          </h3>
          <p className="text-sm text-muted-foreground">
            Personnalisez les clauses contractuelles pour ce document
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      <Tabs defaultValue="clauses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clauses" className="gap-2">
            <Scale className="h-4 w-4" />
            Clauses juridiques
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Échelonnement
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Clauses Tab */}
        <TabsContent value="clauses" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="multiple" className="w-full">
                {Object.entries(CLAUSE_LABELS).map(([key, label]) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {label}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={clauses[key] || ''}
                        onChange={(e) => updateClause(key, e.target.value)}
                        placeholder={`Texte de la clause "${label}"...`}
                        rows={6}
                        className="text-sm"
                      />
                      {!clauses[key] && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => updateClause(key, DEFAULT_MOE_CLAUSES[key] || '')}
                        >
                          Charger le texte par défaut
                        </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Conditions particulières */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conditions particulières</CardTitle>
              <CardDescription>
                Ajoutez des conditions spécifiques à ce projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={document.special_conditions || ''}
                onChange={(e) => onDocumentChange({ ...document, special_conditions: e.target.value })}
                placeholder="Conditions spécifiques pour ce projet..."
                rows={6}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Schedule Tab */}
        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Échelonnement des paiements</CardTitle>
              <CardDescription>
                Définissez l'échéancier de règlement des honoraires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentSchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        value={item.stage}
                        onChange={(e) => updatePaymentItem(index, { stage: e.target.value })}
                        placeholder="Étape de paiement"
                        className="h-9"
                      />
                    </div>
                    {item.description !== undefined && (
                      <div className="flex-1">
                        <Input
                          value={item.description || ''}
                          onChange={(e) => updatePaymentItem(index, { description: e.target.value })}
                          placeholder="Description"
                          className="h-9 text-sm"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        value={item.percentage}
                        onChange={(e) => updatePaymentItem(index, { percentage: parseFloat(e.target.value) || 0 })}
                        className="w-20 h-9 text-right"
                        min={0}
                        max={100}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive shrink-0"
                      onClick={() => removePaymentItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addPaymentItem} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une étape
              </Button>

              <div className="mt-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total</span>
                <div className="flex items-center gap-2">
                  {totalPercentage === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className={`font-bold ${
                    totalPercentage === 100 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {totalPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tarifs par défaut</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Honoraires minimum (€ HT)</Label>
                  <Input
                    type="number"
                    value={minimumFee}
                    onChange={(e) => setMinimumFee(parseFloat(e.target.value) || 0)}
                    placeholder="4000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant minimum de facturation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Tarif réunion supp. (€ HT)</Label>
                  <Input
                    type="number"
                    value={extraMeetingRate}
                    onChange={(e) => setExtraMeetingRate(parseFloat(e.target.value) || 0)}
                    placeholder="250"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tarif des réunions hors forfait
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assurance professionnelle</CardTitle>
                <CardDescription>
                  Informations affichées dans le contrat
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compagnie d'assurance</Label>
                  <Input
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                    placeholder="Ex: MAF"
                  />
                </div>
                <div className="space-y-2">
                  <Label>N° de police</Label>
                  <Input
                    value={insurancePolicyNumber}
                    onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                    placeholder="Ex: 178990/B"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
