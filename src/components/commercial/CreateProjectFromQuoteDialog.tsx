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
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Rocket, 
  Building, 
  Calendar,
  Sparkles,
  CheckCircle2,
  PartyPopper,
  Loader2,
  ArrowRight,
  MapPin,
  Euro
} from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { cn } from '@/lib/utils';

interface CreateProjectFromQuoteDialogProps {
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

export function CreateProjectFromQuoteDialog({
  open,
  onOpenChange,
  document,
  lines,
  onConvert
}: CreateProjectFromQuoteDialogProps) {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state - simplified
  const [useAIPlanning, setUseAIPlanning] = useState(true);
  const [projectStartDate, setProjectStartDate] = useState(
    document.expected_start_date || new Date().toISOString().split('T')[0]
  );
  const [projectEndDate, setProjectEndDate] = useState(document.expected_end_date || '');

  // All included lines are automatically selected
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
  const totalHT = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      // Auto-select all included phases
      const selectedPhaseIds = includedLines.map(l => l.id);
      
      const result = await onConvert({
        useAIPlanning,
        projectStartDate,
        projectEndDate: projectEndDate || undefined,
        selectedPhases: selectedPhaseIds
      });
      
      setCreatedProjectId(result.project.id);
      setShowSuccess(true);
      
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
      handleClose();
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setCreatedProjectId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
              >
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              </motion.div>
              
              <div className="space-y-2">
                <DialogTitle className="flex items-center justify-center gap-2 text-lg">
                  <PartyPopper className="h-5 w-5 text-green-500" />
                  Projet créé avec succès !
                </DialogTitle>
                <p className="text-muted-foreground text-sm">
                  Le projet est prêt avec {includedLines.length} phase(s) importée(s).
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
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Créer le projet
                </DialogTitle>
                <DialogDescription>
                  Lancez le projet à partir de ce devis signé.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {/* Summary card - compact */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{document.title}</p>
                      <p className="text-xs text-muted-foreground">{document.document_number}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0 shrink-0">
                      {formatCurrency(totalHT)}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {document.client_company?.name && (
                      <span className="flex items-center gap-1.5">
                        <Building className="h-3 w-3" />
                        {document.client_company.name}
                      </span>
                    )}
                    {document.project_city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {document.project_city}
                      </span>
                    )}
                    {document.project_surface && (
                      <span>{document.project_surface} m²</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-normal">
                      {includedLines.length} phase{includedLines.length > 1 ? 's' : ''}
                    </Badge>
                    <span className="text-muted-foreground">seront créées automatiquement</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Début
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={projectStartDate}
                      onChange={(e) => setProjectStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs">Fin (optionnelle)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={projectEndDate}
                      onChange={(e) => setProjectEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* AI Planning toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Planification IA
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Suggérer les dates de chaque phase
                    </p>
                  </div>
                  <Switch 
                    checked={useAIPlanning} 
                    onCheckedChange={setUseAIPlanning} 
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleConvert} 
                    disabled={isConverting}
                    className="flex-1"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Créer le projet
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
