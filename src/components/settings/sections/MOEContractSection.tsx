import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Save, 
  RotateCcw, 
  FileText, 
  Layers, 
  CreditCard, 
  Scale,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  CheckCircle2,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DEFAULT_MOE_MISSION_PHASES, 
  DEFAULT_MOE_PAYMENT_SCHEDULE, 
  DEFAULT_MOE_CLAUSES,
  MOEMissionPhase,
  MOEPaymentSchedule
} from '@/lib/moeContractConfig';
import { useMOEContractConfig, MOEContractConfig } from '@/hooks/useMOEContractConfig';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export function MOEContractSection() {
  const { config, isLoading, saveConfig, defaultConfig } = useMOEContractConfig();
  
  // Local state for editing
  const [phases, setPhases] = useState<MOEMissionPhase[]>(DEFAULT_MOE_MISSION_PHASES);
  const [paymentSchedule, setPaymentSchedule] = useState<MOEPaymentSchedule[]>(DEFAULT_MOE_PAYMENT_SCHEDULE);
  const [clauses, setClauses] = useState<Record<string, string>>(DEFAULT_MOE_CLAUSES);
  const [minimumFee, setMinimumFee] = useState(4000);
  const [extraMeetingRate, setExtraMeetingRate] = useState(250);
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load config when available
  useEffect(() => {
    if (config) {
      setPhases(config.mission_phases);
      setPaymentSchedule(config.payment_schedule);
      setClauses(config.clauses);
      setMinimumFee(config.minimum_fee || 4000);
      setExtraMeetingRate(config.extra_meeting_rate || 250);
      setInsuranceCompany(config.insurance_company || '');
      setInsurancePolicyNumber(config.insurance_policy_number || '');
    }
  }, [config]);

  // Handle phase changes
  const updatePhase = (index: number, updates: Partial<MOEMissionPhase>) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], ...updates };
    setPhases(newPhases);
    setHasChanges(true);
  };

  const togglePhaseIncluded = (index: number) => {
    const newPhases = [...phases];
    newPhases[index].is_included = !newPhases[index].is_included;
    setPhases(newPhases);
    setHasChanges(true);
  };

  const handlePhaseDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(phases);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPhases(items);
    setHasChanges(true);
  };

  // Handle payment schedule changes
  const updatePaymentItem = (index: number, updates: Partial<MOEPaymentSchedule>) => {
    const newSchedule = [...paymentSchedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    setPaymentSchedule(newSchedule);
    setHasChanges(true);
  };

  const addPaymentItem = () => {
    setPaymentSchedule([
      ...paymentSchedule,
      { stage: 'Nouvelle étape', percentage: 0 }
    ]);
    setHasChanges(true);
  };

  const removePaymentItem = (index: number) => {
    setPaymentSchedule(paymentSchedule.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  // Handle clause changes
  const updateClause = (key: string, value: string) => {
    setClauses({ ...clauses, [key]: value });
    setHasChanges(true);
  };

  // Calculate total percentage
  const totalPercentage = paymentSchedule.reduce((sum, item) => sum + item.percentage, 0);
  const phasesTotalPercentage = phases.filter(p => p.is_included).reduce((sum, p) => sum + p.percentage, 0);

  // Save all settings
  const handleSave = async () => {
    await saveConfig.mutateAsync({
      mission_phases: phases,
      payment_schedule: paymentSchedule,
      clauses: clauses,
      minimum_fee: minimumFee,
      extra_meeting_rate: extraMeetingRate,
      insurance_company: insuranceCompany,
      insurance_policy_number: insurancePolicyNumber
    });
    setHasChanges(false);
  };

  // Reset to defaults
  const handleReset = () => {
    setPhases(DEFAULT_MOE_MISSION_PHASES);
    setPaymentSchedule(DEFAULT_MOE_PAYMENT_SCHEDULE);
    setClauses(DEFAULT_MOE_CLAUSES);
    setMinimumFee(4000);
    setExtraMeetingRate(250);
    setHasChanges(true);
    toast.info('Configuration réinitialisée aux valeurs par défaut');
  };

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrat MOE Architecture
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurez les paramètres par défaut des contrats de Maîtrise d'Œuvre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={!hasChanges || saveConfig.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Modifications non sauvegardées</span>
        </div>
      )}

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phases" className="gap-2">
            <Layers className="h-4 w-4" />
            Phases
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="clauses" className="gap-2">
            <Scale className="h-4 w-4" />
            Clauses
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Général
          </TabsTrigger>
        </TabsList>

        {/* Phases Tab */}
        <TabsContent value="phases" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Phases de mission (Loi MOP)</CardTitle>
              <CardDescription>
                Configurez les phases par défaut et leur pourcentage d'honoraires
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                              className={`flex items-center gap-3 p-3 border rounded-lg bg-background ${
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
                              
                              <Badge variant="outline" className="shrink-0 font-mono">
                                {phase.code}
                              </Badge>
                              
                              <div className="flex-1 min-w-0">
                                <Input
                                  value={phase.name}
                                  onChange={(e) => updatePhase(index, { name: e.target.value })}
                                  className="h-8 text-sm font-medium"
                                />
                              </div>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                <Input
                                  type="number"
                                  value={phase.percentage}
                                  onChange={(e) => updatePhase(index, { percentage: parseFloat(e.target.value) || 0 })}
                                  className="w-16 h-8 text-right"
                                  min={0}
                                  max={100}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                              
                              {phase.is_optional && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
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

              <div className="mt-4 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total des phases incluses</span>
                <div className="flex items-center gap-2">
                  {phasesTotalPercentage === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className={`font-bold ${
                    phasesTotalPercentage === 100 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {phasesTotalPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Échelonnement des paiements</CardTitle>
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

              <Button
                variant="outline"
                size="sm"
                onClick={addPaymentItem}
                className="mt-3"
              >
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

        {/* Clauses Tab */}
        <TabsContent value="clauses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Clauses contractuelles</CardTitle>
              <CardDescription>
                Personnalisez les clauses par défaut des contrats MOE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(CLAUSE_LABELS).map(([key, label]) => (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="text-sm font-medium">
                      {label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={clauses[key] || ''}
                        onChange={(e) => updateClause(key, e.target.value)}
                        placeholder={`Texte de la clause "${label}"...`}
                        rows={6}
                        className="text-sm"
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Tarifs par défaut et informations d'assurance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Honoraires minimum (€ HT)</Label>
                  <Input
                    type="number"
                    value={minimumFee}
                    onChange={(e) => {
                      setMinimumFee(parseFloat(e.target.value) || 0);
                      setHasChanges(true);
                    }}
                    placeholder="4000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant minimum de facturation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Réunion supplémentaire (€ HT)</Label>
                  <Input
                    type="number"
                    value={extraMeetingRate}
                    onChange={(e) => {
                      setExtraMeetingRate(parseFloat(e.target.value) || 0);
                      setHasChanges(true);
                    }}
                    placeholder="250"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tarif par réunion hors forfait
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Assurance professionnelle</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Compagnie d'assurance</Label>
                    <Input
                      value={insuranceCompany}
                      onChange={(e) => {
                        setInsuranceCompany(e.target.value);
                        setHasChanges(true);
                      }}
                      placeholder="Ex: MAF"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Numéro de police</Label>
                    <Input
                      value={insurancePolicyNumber}
                      onChange={(e) => {
                        setInsurancePolicyNumber(e.target.value);
                        setHasChanges(true);
                      }}
                      placeholder="Ex: 178990/B"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
