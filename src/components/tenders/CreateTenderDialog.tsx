import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  X,
  Calendar,
  Euro,
  MapPin,
  Building2,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenders } from "@/hooks/useTenders";
import { PROCEDURE_TYPE_LABELS } from "@/lib/tenderTypes";

interface ExtractedInfo {
  title?: string;
  reference?: string;
  client_name?: string;
  client_type?: string;
  location?: string;
  estimated_budget?: number;
  procedure_type?: string;
  submission_deadline?: string;
  site_visit_date?: string;
  site_visit_required?: boolean;
  project_description?: string;
  surface_area?: number;
  detected_documents?: { filename: string; type: string }[];
}

interface CreateTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTenderDialog({ open, onOpenChange }: CreateTenderDialogProps) {
  const navigate = useNavigate();
  const { createTender } = useTenders();
  
  // Step management
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form state (pre-filled by AI)
  const [formData, setFormData] = useState<ExtractedInfo>({});
  const [isCreating, setIsCreating] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(f =>
      f.type === 'application/pdf' ||
      f.type.includes('word') ||
      f.type.includes('excel') ||
      f.type.includes('spreadsheet')
    );
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Analyze files with AI
  const handleAnalyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Déposez au moins un fichier DCE");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert files to base64 for AI analysis
      const filesData = await Promise.all(uploadedFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        content: await file.arrayBuffer().then(buf =>
          btoa(String.fromCharCode(...new Uint8Array(buf)))
        ),
      })));

      // Call edge function to analyze before creation
      const { data, error } = await supabase.functions.invoke('analyze-dce-before-creation', {
        body: { files: filesData }
      });

      if (error) throw error;

      if (data?.extractedData) {
        setFormData(data.extractedData);
        toast.success("Analyse terminée !");
      } else {
        setFormData({ title: "Nouveau concours" });
      }
      
      setStep('form');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Erreur lors de l'analyse IA - formulaire vierge");
      setFormData({ title: "" });
      setStep('form');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Skip analysis and go directly to form
  const handleSkipAnalysis = () => {
    setFormData({ title: "" });
    setStep('form');
  };

  // Create tender with form data
  const handleCreateTender = async () => {
    if (!formData.title?.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    setIsCreating(true);

    try {
      const reference = formData.reference || `AO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

      const result = await createTender.mutateAsync({
        reference,
        title: formData.title,
        status: 'en_analyse',
        client_name: formData.client_name || undefined,
        client_type: formData.client_type || undefined,
        location: formData.location || undefined,
        estimated_budget: formData.estimated_budget || undefined,
        procedure_type: formData.procedure_type || undefined,
        submission_deadline: formData.submission_deadline || undefined,
        site_visit_date: formData.site_visit_date || undefined,
        site_visit_required: formData.site_visit_required || undefined,
        description: formData.project_description || undefined,
        surface_area: formData.surface_area || undefined,
      });

      // Store files for upload on detail page
      if (uploadedFiles.length > 0) {
        const fileData = await Promise.all(uploadedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await file.arrayBuffer().then(buf =>
            btoa(String.fromCharCode(...new Uint8Array(buf)))
          ),
        })));
        sessionStorage.setItem(`tender-files-${result.id}`, JSON.stringify(fileData));
      }

      // Reset and navigate
      handleClose();
      navigate(`/tenders/${result.id}?autoUpload=true`);
      toast.success("Concours créé avec succès");
    } catch (error) {
      console.error('Create error:', error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset dialog state
  const handleClose = () => {
    setStep('upload');
    setUploadedFiles([]);
    setFormData({});
    setIsAnalyzing(false);
    setIsCreating(false);
    onOpenChange(false);
  };

  const updateFormField = (field: keyof ExtractedInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'upload' ? (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Nouveau concours
              </>
            ) : (
              <>
                <FileSearch className="h-5 w-5 text-primary" />
                Informations du concours
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? "Déposez vos documents DCE et l'IA extraira automatiquement les informations"
              : "Vérifiez et complétez les informations avant de créer le concours"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' ? (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  isAnalyzing && "opacity-50 pointer-events-none"
                )}
              >
                <input
                  type="file"
                  id="dce-upload"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <label htmlFor="dce-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "p-4 rounded-full transition-colors",
                      isDragging ? "bg-primary/10" : "bg-muted"
                    )}>
                      {isAnalyzing ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      ) : (
                        <Upload className={cn(
                          "h-8 w-8 transition-colors",
                          isDragging ? "text-primary" : "text-muted-foreground"
                        )} />
                      )}
                    </div>
                    <div>
                      {isAnalyzing ? (
                        <>
                          <p className="font-medium text-primary">Analyse IA en cours...</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Extraction des informations du DCE
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">
                            Glissez vos fichiers DCE ici
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            ou cliquez pour sélectionner • PDF, Word, Excel
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && !isAnalyzing && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {uploadedFiles.length} fichier(s) prêt(s) pour l'analyse
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-muted-foreground text-xs shrink-0">
                            ({(file.size / 1024).toFixed(0)} Ko)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* What AI will do */}
              {!isAnalyzing && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    L'IA va automatiquement extraire :
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Titre et référence du marché</li>
                    <li>• Maître d'ouvrage et contacts</li>
                    <li>• Budget, délais et dates clés</li>
                    <li>• Critères de jugement et pondérations</li>
                    <li>• Liste des pièces à fournir</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Form with pre-filled data */
            <div className="space-y-6">
              {/* Success message if AI extracted data */}
              {formData.title && uploadedFiles.length > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-sm font-medium text-emerald-700">
                    Informations pré-remplies par l'IA - Vérifiez et ajustez si nécessaire
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre du marché *</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    placeholder="Ex: Construction d'un groupe scolaire"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reference">Référence</Label>
                    <Input
                      id="reference"
                      value={formData.reference || ''}
                      onChange={(e) => updateFormField('reference', e.target.value)}
                      placeholder="Ex: MAPA-2024-015"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="procedure_type">Type de procédure</Label>
                    <Select
                      value={formData.procedure_type || ''}
                      onValueChange={(value) => updateFormField('procedure_type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROCEDURE_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Maître d'ouvrage
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Nom</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name || ''}
                      onChange={(e) => updateFormField('client_name', e.target.value)}
                      placeholder="Ex: Ville de Lyon"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_type">Type</Label>
                    <Select
                      value={formData.client_type || ''}
                      onValueChange={(value) => updateFormField('client_type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collectivite">Collectivité</SelectItem>
                        <SelectItem value="bailleur_social">Bailleur social</SelectItem>
                        <SelectItem value="etat">État</SelectItem>
                        <SelectItem value="hopital">Hôpital</SelectItem>
                        <SelectItem value="universite">Université</SelectItem>
                        <SelectItem value="etablissement_public">Établissement public</SelectItem>
                        <SelectItem value="prive">Privé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location & Budget */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Lieu
                    </Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => updateFormField('location', e.target.value)}
                      placeholder="Ex: Paris 15ème"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_budget" className="flex items-center gap-1.5">
                      <Euro className="h-3.5 w-3.5" />
                      Budget estimé (€ HT)
                    </Label>
                    <Input
                      id="estimated_budget"
                      type="number"
                      value={formData.estimated_budget || ''}
                      onChange={(e) => updateFormField('estimated_budget', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Ex: 2500000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="surface_area">Surface (m²)</Label>
                    <Input
                      id="surface_area"
                      type="number"
                      value={formData.surface_area || ''}
                      onChange={(e) => updateFormField('surface_area', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Ex: 1500"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Dates clés
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="submission_deadline">Date limite de dépôt</Label>
                    <Input
                      id="submission_deadline"
                      type="date"
                      value={formData.submission_deadline || ''}
                      onChange={(e) => updateFormField('submission_deadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site_visit_date">Date de visite</Label>
                    <Input
                      id="site_visit_date"
                      type="date"
                      value={formData.site_visit_date || ''}
                      onChange={(e) => updateFormField('site_visit_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="site_visit_required"
                    checked={formData.site_visit_required || false}
                    onCheckedChange={(checked) => updateFormField('site_visit_required', checked)}
                  />
                  <Label htmlFor="site_visit_required" className="text-sm cursor-pointer">
                    Visite de site obligatoire
                  </Label>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="project_description">Description du projet</Label>
                <Textarea
                  id="project_description"
                  value={formData.project_description || ''}
                  onChange={(e) => updateFormField('project_description', e.target.value)}
                  placeholder="Décrivez brièvement le projet..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2">
          {step === 'upload' ? (
            <>
              <Button variant="ghost" onClick={handleSkipAnalysis} disabled={isAnalyzing}>
                Créer sans documents
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button
                  onClick={handleAnalyzeFiles}
                  disabled={uploadedFiles.length === 0 || isAnalyzing}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      Analyser avec l'IA
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep('upload')}>
                ← Retour
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateTender}
                  disabled={isCreating || !formData.title?.trim()}
                  className="gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      Créer le concours
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
