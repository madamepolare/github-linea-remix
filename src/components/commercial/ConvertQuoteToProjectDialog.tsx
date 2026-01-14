import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Rocket, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Building, 
  Calendar,
  FileText,
  Sparkles,
  CheckCircle2,
  PartyPopper,
  Receipt,
  Loader2
} from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { cn } from '@/lib/utils';

interface ConvertQuoteToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: QuoteDocument;
  lines: QuoteLine[];
  onConvert: (params: {
    useAIPlanning: boolean;
    projectStartDate?: string;
    projectEndDate?: string;
    selectedPhases: string[];
  }) => Promise<{ project: { id: string } }>;
}

type Step = 'summary' | 'details' | 'phases' | 'success';

export function ConvertQuoteToProjectDialog({
  open,
  onOpenChange,
  document,
  lines,
  onConvert
}: ConvertQuoteToProjectDialogProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('summary');
  const [isConverting, setIsConverting] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  // Form state
  const [useAIPlanning, setUseAIPlanning] = useState(true);
  const [projectStartDate, setProjectStartDate] = useState(
    document.expected_start_date || new Date().toISOString().split('T')[0]
  );
  const [projectEndDate, setProjectEndDate] = useState(document.expected_end_date || '');
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<string[]>(
    lines.filter(l => l.is_included).map(l => l.id)
  );

  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
  const totalHT = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleNext = () => {
    const steps: Step[] = ['summary', 'details', 'phases', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps: Step[] = ['summary', 'details', 'phases', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const result = await onConvert({
        useAIPlanning,
        projectStartDate,
        projectEndDate: projectEndDate || undefined,
        selectedPhases: selectedPhaseIds
      });
      
      setCreatedProjectId(result.project.id);
      setStep('success');
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleViewProject = () => {
    if (createdProjectId) {
      navigate(`/projects/${createdProjectId}`);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setStep('summary');
    setCreatedProjectId(null);
    onOpenChange(false);
  };

  const togglePhase = (phaseId: string) => {
    setSelectedPhaseIds(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['summary', 'details', 'phases'].map((s, index) => (
        <div key={s} className="flex items-center">
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
              step === s 
                ? "bg-primary text-primary-foreground" 
                : step === 'success' || ['summary', 'details', 'phases'].indexOf(step) > index
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {step === 'success' || ['summary', 'details', 'phases'].indexOf(step) > index 
              ? <Check className="h-4 w-4" /> 
              : index + 1}
          </div>
          {index < 2 && (
            <div 
              className={cn(
                "w-12 h-0.5 mx-1",
                ['summary', 'details', 'phases'].indexOf(step) > index || step === 'success'
                  ? "bg-green-500" 
                  : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'success' ? (
              <>
                <PartyPopper className="h-5 w-5 text-green-500" />
                Projet créé avec succès !
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 text-primary" />
                Lancer le projet
              </>
            )}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription>
              Convertissez ce devis en projet et démarrez votre mission.
            </DialogDescription>
          )}
        </DialogHeader>

        {step !== 'success' && stepIndicator}

        <AnimatePresence mode="wait">
          {/* Step 1: Summary */}
          {step === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Devis</p>
                    <p className="font-medium">{document.title}</p>
                    <p className="text-sm text-muted-foreground">{document.document_number}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {formatCurrency(totalHT)} HT
                  </Badge>
                </div>

                {document.client_company?.name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{document.client_company.name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{includedLines.length} phase(s) incluse(s)</span>
                </div>

                {document.invoice_schedule && Array.isArray(document.invoice_schedule) && document.invoice_schedule.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span>{document.invoice_schedule.length} échéance(s) de facturation</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Planification IA
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Suggérer automatiquement les dates des phases
                    </p>
                  </div>
                  <Switch 
                    checked={useAIPlanning} 
                    onCheckedChange={setUseAIPlanning} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Date de début
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={projectStartDate}
                      onChange={(e) => setProjectStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date de fin (optionnelle)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={projectEndDate}
                      onChange={(e) => setProjectEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Project details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Ces informations seront transférées au projet :
              </p>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Nom du projet</p>
                      <p className="font-medium truncate">{document.title || 'Sans titre'}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{document.project_type}</p>
                    </div>
                  </div>

                  {document.client_company?.name && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium">{document.client_company.name}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {document.project_address && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Adresse</p>
                        <p className="font-medium text-sm">{document.project_address}</p>
                      </div>
                    )}
                    {(document.postal_code || document.project_city) && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Ville</p>
                        <p className="font-medium text-sm">
                          {[document.postal_code, document.project_city].filter(Boolean).join(' ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {document.project_surface && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Surface</p>
                        <p className="font-medium">{document.project_surface} m²</p>
                      </div>
                    )}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-medium">{formatCurrency(totalHT)}</p>
                    </div>
                  </div>

                  {document.description && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm line-clamp-3">{document.description}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {/* Step 3: Phases selection */}
          {step === 'phases' && (
            <motion.div
              key="phases"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Phases à créer dans le projet :
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (selectedPhaseIds.length === includedLines.length) {
                      setSelectedPhaseIds([]);
                    } else {
                      setSelectedPhaseIds(includedLines.map(l => l.id));
                    }
                  }}
                >
                  {selectedPhaseIds.length === includedLines.length ? 'Désélectionner tout' : 'Tout sélectionner'}
                </Button>
              </div>
              
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                  {includedLines.map((line) => (
                    <div 
                      key={line.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                        selectedPhaseIds.includes(line.id) 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-muted/30 border-transparent hover:border-muted"
                      )}
                      onClick={() => togglePhase(line.id)}
                    >
                      <Checkbox 
                        checked={selectedPhaseIds.includes(line.id)}
                        onCheckedChange={() => togglePhase(line.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {line.phase_code}
                          </Badge>
                          <span className="font-medium text-sm truncate">{line.phase_name}</span>
                        </div>
                        {line.deliverables && Array.isArray(line.deliverables) && line.deliverables.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {line.deliverables.length} livrable(s)
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground shrink-0">
                        {formatCurrency(line.amount || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedPhaseIds.length} phase(s) sélectionnée(s)
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    includedLines
                      .filter(l => selectedPhaseIds.includes(l.id))
                      .reduce((sum, l) => sum + (l.amount || 0), 0)
                  )}
                </span>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              </motion.div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Félicitations !</h3>
                <p className="text-muted-foreground">
                  Votre projet a été créé avec succès à partir du devis.
                </p>
                <p className="text-sm text-muted-foreground">
                  Le devis est maintenant verrouillé et lié au projet.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Fermer
                </Button>
                <Button onClick={handleViewProject}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Voir le projet
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step !== 'success' && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={step === 'summary' ? handleClose : handlePrevious}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 'summary' ? 'Annuler' : 'Retour'}
            </Button>
            
            {step === 'phases' ? (
              <Button 
                onClick={handleConvert} 
                disabled={isConverting || selectedPhaseIds.length === 0}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Lancer le projet
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
