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
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Rocket, 
  Building, 
  Calendar,
  FileText,
  CheckCircle2,
  PartyPopper,
  Loader2,
  FolderTree,
  Receipt
} from 'lucide-react';
import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';

interface ConvertQuoteToSubProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: QuoteDocument;
  lines: QuoteLine[];
  parentProject: {
    id: string;
    name: string;
  };
  onConvert: (params: {
    subProjectName: string;
    deadline?: string;
  }) => Promise<{ subProject: { id: string; parent_id: string } }>;
}

export function ConvertQuoteToSubProjectDialog({
  open,
  onOpenChange,
  document,
  lines,
  parentProject,
  onConvert
}: ConvertQuoteToSubProjectDialogProps) {
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);
  const [createdSubProjectId, setCreatedSubProjectId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [subProjectName, setSubProjectName] = useState(document.title || 'Travaux supplémentaires');
  const [deadline, setDeadline] = useState('');

  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount');
  const totalHT = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const result = await onConvert({
        subProjectName,
        deadline: deadline || undefined
      });
      
      setCreatedSubProjectId(result.subProject.id);
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
    if (parentProject?.id) {
      navigate(`/projects/${parentProject.id}`);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setCreatedSubProjectId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSuccess ? (
              <>
                <PartyPopper className="h-5 w-5 text-green-500" />
                Demande créée !
              </>
            ) : (
              <>
                <FolderTree className="h-5 w-5 text-amber-500" />
                Valider les travaux supplémentaires
              </>
            )}
          </DialogTitle>
          {!showSuccess && (
            <DialogDescription>
              Ce devis est rattaché à un accord-cadre. La validation créera une demande supplémentaire.
            </DialogDescription>
          )}
        </DialogHeader>

        {showSuccess ? (
          <motion.div
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
              <p className="text-muted-foreground text-sm">
                La demande <strong>{subProjectName}</strong> a été créée dans le projet accord-cadre.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>Projet parent : <strong>{parentProject.name}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span>Montant : <strong>{formatCurrency(totalHT)}</strong></span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              <Button onClick={handleViewProject}>
                <Rocket className="h-4 w-4 mr-2" />
                Voir le projet
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Parent project info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Accord-cadre</p>
                  <p className="font-medium">{parentProject.name}</p>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Travaux supplémentaires
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
                <span>Devis {document.document_number} • {formatCurrency(totalHT)} HT</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la demande</Label>
                <Input
                  id="name"
                  value={subProjectName}
                  onChange={(e) => setSubProjectName(e.target.value)}
                  placeholder="Ex: Extension parking, Mise aux normes..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date limite souhaitée (optionnelle)
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Info box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Le devis sera marqué comme "Accepté" et une demande supplémentaire sera créée dans l'accord-cadre, 
                prête à être suivie et facturée.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleConvert} 
                disabled={isConverting || !subProjectName.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider et créer la demande
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
