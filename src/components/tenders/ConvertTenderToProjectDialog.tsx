import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Calendar,
  Euro,
  Ruler,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FolderOpen,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConvertTenderToProject } from '@/hooks/useConvertTenderToProject';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

interface Tender {
  id: string;
  title: string;
  reference?: string;
  client_name?: string;
  client_company_id?: string;
  location?: string;
  estimated_budget?: number;
  surface_area?: number;
  description?: string;
  discipline_slug?: string;
  tender_team_members?: any[];
}

interface ConvertTenderToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender;
}

type Step = 'summary' | 'details' | 'options' | 'success';

export function ConvertTenderToProjectDialog({
  open,
  onOpenChange,
  tender,
}: ConvertTenderToProjectDialogProps) {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const convertTender = useConvertTenderToProject(activeWorkspace?.id);
  
  const [step, setStep] = useState<Step>('summary');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'architecture',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    surface: '',
    budget: '',
    expectedStartDate: '',
    expectedEndDate: '',
    transferTeam: true,
    transferTasks: true,
  });

  // Pre-fill form when tender changes
  useEffect(() => {
    if (tender) {
      setFormData({
        projectName: tender.title || '',
        projectType: tender.discipline_slug || 'architecture',
        description: tender.description || '',
        address: tender.location || '',
        city: '',
        postalCode: '',
        surface: tender.surface_area?.toString() || '',
        budget: tender.estimated_budget?.toString() || '',
        expectedStartDate: '',
        expectedEndDate: '',
        transferTeam: true,
        transferTasks: true,
      });
    }
  }, [tender]);

  const handleNext = () => {
    const steps: Step[] = ['summary', 'details', 'options', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1] as Step);
    }
  };

  const handlePrevious = () => {
    const steps: Step[] = ['summary', 'details', 'options', 'success'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1] as Step);
    }
  };

  const handleConvert = async () => {
    try {
      const project = await convertTender.mutateAsync({
        tenderId: tender.id,
        projectName: formData.projectName,
        projectType: formData.projectType,
        description: formData.description || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        surface: formData.surface ? parseFloat(formData.surface) : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        expectedStartDate: formData.expectedStartDate || undefined,
        expectedEndDate: formData.expectedEndDate || undefined,
        transferTeam: formData.transferTeam,
        transferTasks: formData.transferTasks,
      });

      setCreatedProjectId(project.id);
      setStep('success');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Conversion error:', error);
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

  const teamCount = tender.tender_team_members?.length || 0;

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['summary', 'details', 'options'].map((s, index) => (
        <div key={s} className="flex items-center">
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
              step === s 
                ? "bg-primary text-primary-foreground" 
                : step === 'success' || ['summary', 'details', 'options'].indexOf(step) > index
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {step === 'success' || ['summary', 'details', 'options'].indexOf(step) > index 
              ? <CheckCircle2 className="h-4 w-4" /> 
              : index + 1}
          </div>
          {index < 2 && (
            <div 
              className={cn(
                "w-12 h-0.5 mx-1",
                ['summary', 'details', 'options'].indexOf(step) > index || step === 'success'
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === 'success' ? 'Projet créé !' : 'Convertir en Projet'}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription>
              Transformez cet appel d'offres gagné en projet
            </DialogDescription>
          )}
        </DialogHeader>

        {step !== 'success' && stepIndicator}

        {step === 'summary' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FolderOpen className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium">{tender.title}</h4>
                  {tender.reference && (
                    <p className="text-sm text-muted-foreground">Réf: {tender.reference}</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {tender.client_name && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{tender.client_name}</span>
                  </div>
                )}
                {tender.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{tender.location}</span>
                  </div>
                )}
                {tender.estimated_budget && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(tender.estimated_budget)}</span>
                  </div>
                )}
                {tender.surface_area && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span>{tender.surface_area} m²</span>
                  </div>
                )}
              </div>
              
              {teamCount > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{teamCount} membre(s) dans l'équipe</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="projectName">Nom du projet *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Nom du projet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du projet"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ville"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="surface">Surface (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    value={formData.surface}
                    onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                    placeholder="Surface"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (€ HT)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Budget"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Retour
              </Button>
              <Button onClick={handleNext} disabled={!formData.projectName}>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'options' && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Transférer l'équipe</p>
                    <p className="text-xs text-muted-foreground">
                      {teamCount} membre(s) seront ajoutés au projet
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.transferTeam}
                  onCheckedChange={(checked) => setFormData({ ...formData, transferTeam: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Transférer les tâches</p>
                    <p className="text-xs text-muted-foreground">
                      Les tâches "À faire" seront liées au projet
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.transferTasks}
                  onCheckedChange={(checked) => setFormData({ ...formData, transferTasks: checked })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.expectedStartDate}
                    onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin prévue</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.expectedEndDate}
                    onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Retour
              </Button>
              <Button 
                onClick={handleConvert} 
                disabled={convertTender.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {convertTender.isPending ? 'Création...' : 'Créer le projet'}
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Projet créé avec succès !</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Le projet "{formData.projectName}" est prêt.
              </p>
            </div>
            
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              <Button onClick={handleViewProject}>
                Voir le projet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
