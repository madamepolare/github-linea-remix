import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Layers,
  CreditCard,
  Scale,
  Settings2
} from 'lucide-react';
import { 
  DEFAULT_MOE_MISSION_PHASES, 
  DEFAULT_MOE_PAYMENT_SCHEDULE, 
  DEFAULT_MOE_CLAUSES,
  MOEMissionPhase,
  MOEPaymentSchedule
} from '@/lib/moeContractConfig';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export interface MOEConfigData {
  mission_phases: MOEMissionPhase[];
  payment_schedule: MOEPaymentSchedule[];
  clauses: Record<string, string>;
  minimum_fee?: number;
  extra_meeting_rate?: number;
  insurance_company?: string;
  insurance_policy_number?: string;
}

interface ContractMOEConfigProps {
  config: MOEConfigData;
  onChange: (config: MOEConfigData) => void;
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
  honoraires_nota: 'Note sur les honoraires',
  reunion_supplementaire: 'Réunions supplémentaires'
};

export function ContractMOEConfig({ config, onChange }: ContractMOEConfigProps) {
  const [phases, setPhases] = useState<MOEMissionPhase[]>(
    config.mission_phases?.length > 0 ? config.mission_phases : DEFAULT_MOE_MISSION_PHASES
  );
  const [paymentSchedule, setPaymentSchedule] = useState<MOEPaymentSchedule[]>(
    config.payment_schedule?.length > 0 ? config.payment_schedule : DEFAULT_MOE_PAYMENT_SCHEDULE
  );
  const [clauses, setClauses] = useState<Record<string, string>>(
    Object.keys(config.clauses || {}).length > 0 ? config.clauses : DEFAULT_MOE_CLAUSES
  );
  const [minimumFee, setMinimumFee] = useState(config.minimum_fee || 4000);
  const [extraMeetingRate, setExtraMeetingRate] = useState(config.extra_meeting_rate || 250);
  const [insuranceCompany, setInsuranceCompany] = useState(config.insurance_company || '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(config.insurance_policy_number || '');

  const updateAndNotify = (updates: Partial<MOEConfigData>) => {
    const newConfig: MOEConfigData = {
      mission_phases: updates.mission_phases ?? phases,
      payment_schedule: updates.payment_schedule ?? paymentSchedule,
      clauses: updates.clauses ?? clauses,
      minimum_fee: updates.minimum_fee ?? minimumFee,
      extra_meeting_rate: updates.extra_meeting_rate ?? extraMeetingRate,
      insurance_company: updates.insurance_company ?? insuranceCompany,
      insurance_policy_number: updates.insurance_policy_number ?? insurancePolicyNumber
    };
    onChange(newConfig);
  };

  const updatePhase = (index: number, updates: Partial<MOEMissionPhase>) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], ...updates };
    setPhases(newPhases);
    updateAndNotify({ mission_phases: newPhases });
  };

  const togglePhaseIncluded = (index: number) => {
    const newPhases = [...phases];
    newPhases[index].is_included = !newPhases[index].is_included;
    setPhases(newPhases);
    updateAndNotify({ mission_phases: newPhases });
  };

  const handlePhaseDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(phases);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPhases(items);
    updateAndNotify({ mission_phases: items });
  };

  const updatePaymentItem = (index: number, updates: Partial<MOEPaymentSchedule>) => {
    const newSchedule = [...paymentSchedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    setPaymentSchedule(newSchedule);
    updateAndNotify({ payment_schedule: newSchedule });
  };

  const addPaymentItem = () => {
    const newSchedule = [...paymentSchedule, { stage: 'Nouvelle étape', percentage: 0 }];
    setPaymentSchedule(newSchedule);
    updateAndNotify({ payment_schedule: newSchedule });
  };

  const removePaymentItem = (index: number) => {
    const newSchedule = paymentSchedule.filter((_, i) => i !== index);
    setPaymentSchedule(newSchedule);
    updateAndNotify({ payment_schedule: newSchedule });
  };

  const updateClause = (key: string, value: string) => {
    const newClauses = { ...clauses, [key]: value };
    setClauses(newClauses);
    updateAndNotify({ clauses: newClauses });
  };

  const totalPercentage = paymentSchedule.reduce((sum, item) => sum + item.percentage, 0);
  const phasesTotalPercentage = phases.filter(p => p.is_included).reduce((sum, p) => sum + p.percentage, 0);

  const handleReset = () => {
    setPhases(DEFAULT_MOE_MISSION_PHASES);
    setPaymentSchedule(DEFAULT_MOE_PAYMENT_SCHEDULE);
    setClauses(DEFAULT_MOE_CLAUSES);
    setMinimumFee(4000);
    setExtraMeetingRate(250);
    updateAndNotify({
      mission_phases: DEFAULT_MOE_MISSION_PHASES,
      payment_schedule: DEFAULT_MOE_PAYMENT_SCHEDULE,
      clauses: DEFAULT_MOE_CLAUSES,
      minimum_fee: 4000,
      extra_meeting_rate: 250
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configuration des phases, paiements et clauses pour les contrats MOE
        </p>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Réinitialiser
        </Button>
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phases" className="gap-1 text-xs">
            <Layers className="h-3 w-3" />
            Phases
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1 text-xs">
            <CreditCard className="h-3 w-3" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="clauses" className="gap-1 text-xs">
            <Scale className="h-3 w-3" />
            Clauses
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-1 text-xs">
            <Settings2 className="h-3 w-3" />
            Général
          </TabsTrigger>
        </TabsList>

        {/* Phases Tab */}
        <TabsContent value="phases" className="mt-4">
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
              <DragDropContext onDragEnd={handlePhaseDragEnd}>
                <Droppable droppableId="phases">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {phases.map((phase, index) => (
                        <Draggable key={phase.code} draggableId={phase.code} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-2 p-2 border rounded-lg bg-background ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              } ${!phase.is_included ? 'opacity-60' : ''}`}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              <Switch
                                checked={phase.is_included}
                                onCheckedChange={() => togglePhaseIncluded(index)}
                              />
                              
                              <Badge variant="outline" className="shrink-0 font-mono text-xs">
                                {phase.code}
                              </Badge>
                              
                              <div className="flex-1 min-w-0">
                                <Input
                                  value={phase.name}
                                  onChange={(e) => updatePhase(index, { name: e.target.value })}
                                  className="h-7 text-xs"
                                />
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <Input
                                  type="number"
                                  value={phase.percentage}
                                  onChange={(e) => updatePhase(index, { percentage: parseFloat(e.target.value) || 0 })}
                                  className="w-14 h-7 text-xs text-right"
                                  min={0}
                                  max={100}
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                              
                              {phase.is_optional && (
                                <Badge variant="secondary" className="shrink-0 text-[10px]">
                                  Option
                                </Badge>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mt-4">
                <span className="text-xs font-medium">Total phases incluses</span>
                <div className="flex items-center gap-2">
                  {phasesTotalPercentage === 100 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                  )}
                  <span className={`text-xs font-bold ${
                    phasesTotalPercentage === 100 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {phasesTotalPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="mt-4">
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
              {paymentSchedule.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      value={item.stage}
                      onChange={(e) => updatePaymentItem(index, { stage: e.target.value })}
                      placeholder="Étape de paiement"
                      className="h-8 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      value={item.percentage}
                      onChange={(e) => updatePaymentItem(index, { percentage: parseFloat(e.target.value) || 0 })}
                      className="w-16 h-8 text-right text-sm"
                      min={0}
                      max={100}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => removePaymentItem(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addPaymentItem}
                className="mt-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter une étape
              </Button>

              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mt-4">
                <span className="text-xs font-medium">Total</span>
                <div className="flex items-center gap-2">
                  {totalPercentage === 100 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                  )}
                  <span className={`text-xs font-bold ${
                    totalPercentage === 100 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {totalPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Clauses Tab */}
        <TabsContent value="clauses" className="mt-4">
          <ScrollArea className="h-[350px] pr-4">
            <Accordion type="multiple" className="w-full">
              {Object.entries(CLAUSE_LABELS).map(([key, label]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger className="text-xs font-medium py-2">
                    {label}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      value={clauses[key] || ''}
                      onChange={(e) => updateClause(key, e.target.value)}
                      placeholder={`Texte de la clause "${label}"...`}
                      rows={4}
                      className="text-xs"
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4">
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Honoraires minimum (€ HT)</Label>
                  <Input
                    type="number"
                    value={minimumFee}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setMinimumFee(val);
                      updateAndNotify({ minimum_fee: val });
                    }}
                    placeholder="4000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tarif réunion supp. (€ HT)</Label>
                  <Input
                    type="number"
                    value={extraMeetingRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setExtraMeetingRate(val);
                      updateAndNotify({ extra_meeting_rate: val });
                    }}
                    placeholder="250"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Assurance professionnelle</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Compagnie d'assurance</Label>
                    <Input
                      value={insuranceCompany}
                      onChange={(e) => {
                        setInsuranceCompany(e.target.value);
                        updateAndNotify({ insurance_company: e.target.value });
                      }}
                      placeholder="Ex: MAF"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">N° de police</Label>
                    <Input
                      value={insurancePolicyNumber}
                      onChange={(e) => {
                        setInsurancePolicyNumber(e.target.value);
                        updateAndNotify({ insurance_policy_number: e.target.value });
                      }}
                      placeholder="Ex: 178990/B"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
