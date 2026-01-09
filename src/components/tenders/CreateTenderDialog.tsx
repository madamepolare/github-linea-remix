import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Calendar,
  Euro,
  MapPin,
  Building2,
  FileSearch,
  Link,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenders } from "@/hooks/useTenders";
import { 
  PROCEDURE_TYPE_LABELS, 
  SUBMISSION_TYPE_LABELS,
  CLIENT_TYPES,
  type TenderType,
  type SubmissionType,
  type CriterionType,
} from "@/lib/tenderTypes";
import { TenderTypeSelector } from "./TenderTypeSelector";
import { MOASelector } from "./MOASelector";
import { CriteriaWeightEditor, type CriterionItem } from "./CriteriaWeightEditor";
import { RequiredTeamEditor, type RequiredTeamItem } from "./RequiredTeamEditor";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface ExtractedInfo {
  title?: string;
  reference?: string;
  tender_type?: TenderType;
  submission_type?: SubmissionType;
  client_name?: string;
  client_type?: string;
  moa_company_id?: string | null;
  location?: string;
  department?: string;
  estimated_budget?: number;
  procedure_type?: string;
  procedure_other?: string;
  submission_deadline?: string;
  submission_time?: string;
  candidature_deadline?: string;
  candidature_time?: string;
  site_visit_date?: string;
  site_visit_time?: string;
  site_visit_required?: boolean;
  site_visit_location?: string;
  site_visit_contact_name?: string;
  site_visit_contact_email?: string;
  site_visit_assigned_user_id?: string | null;
  dce_link?: string;
  project_description?: string;
  ai_summary?: string;
  surface_area?: number;
  moe_phases?: string[];
  criteria?: CriterionItem[];
  required_team?: RequiredTeamItem[];
  critical_alerts?: Array<{ type: string; message: string; severity: string }>;
  detected_documents?: { filename: string; type: string }[];
}

interface ExtractionStats {
  files_analyzed: number;
  files_skipped: number;
  criteria_found: number;
  team_requirements: number;
  alerts_found: number;
}

interface CreateTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'type' | 'upload' | 'form';

export function CreateTenderDialog({ open, onOpenChange }: CreateTenderDialogProps) {
  const navigate = useNavigate();
  const { createTender } = useTenders();
  const { companies } = useCRMCompanies();
  const { data: members } = useTeamMembers();
  
  // Step management
  const [step, setStep] = useState<Step>('type');
  
  // Type selection
  const [tenderType, setTenderType] = useState<TenderType>('architecture');
  
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>("");
  
  // Form state (pre-filled by AI)
  const [formData, setFormData] = useState<ExtractedInfo>({
    tender_type: 'architecture',
    submission_type: 'candidature_offre',
    criteria: [],
    required_team: [],
  });
  const [extractionStats, setExtractionStats] = useState<ExtractionStats | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
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
    setAnalysisProgress("Préparation des fichiers...");

    try {
      // Prepare files with progress feedback
      setAnalysisProgress(`Lecture de ${uploadedFiles.length} fichier(s)...`);
      
      const filesData = await Promise.all(uploadedFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        content: await file.arrayBuffer().then(buf =>
          btoa(String.fromCharCode(...new Uint8Array(buf)))
        ),
      })));

      setAnalysisProgress("Analyse IA en cours... Lecture des documents PDF");

      const { data, error } = await supabase.functions.invoke('analyze-dce-before-creation', {
        body: { files: filesData, tender_type: tenderType }
      });

      if (error) throw error;

      if (data?.extractedData) {
        // Track which fields were filled by AI
        const filledFields = new Set<string>();
        const extracted = data.extractedData;
        
        if (extracted.title) filledFields.add('title');
        if (extracted.reference) filledFields.add('reference');
        if (extracted.client_name) filledFields.add('client_name');
        if (extracted.client_type) filledFields.add('client_type');
        if (extracted.location) filledFields.add('location');
        if (extracted.estimated_budget) filledFields.add('estimated_budget');
        if (extracted.procedure_type) filledFields.add('procedure_type');
        if (extracted.submission_deadline) filledFields.add('submission_deadline');
        if (extracted.site_visit_date) filledFields.add('site_visit_date');
        if (extracted.site_visit_required !== undefined) filledFields.add('site_visit_required');
        if (extracted.project_description) filledFields.add('project_description');
        if (extracted.surface_area) filledFields.add('surface_area');
        if (extracted.criteria?.length > 0) filledFields.add('criteria');
        if (extracted.required_team?.length > 0) filledFields.add('required_team');
        
        setAiFilledFields(filledFields);
        setExtractionStats(data.stats || null);
        
        setFormData({
          ...extracted,
          tender_type: tenderType,
          submission_type: extracted.submission_type || 'candidature_offre',
          criteria: extracted.criteria || [],
          required_team: extracted.required_team || [],
        });
        
        const statsMsg = data.stats 
          ? `${data.stats.files_analyzed} fichiers analysés, ${data.stats.criteria_found} critères extraits`
          : "Données extraites";
        toast.success(`Analyse terminée ! ${statsMsg}`);
      } else {
        setFormData({ 
          title: "Nouvel appel d'offre",
          tender_type: tenderType,
          submission_type: 'candidature_offre',
          criteria: [],
          required_team: [],
        });
        setAiFilledFields(new Set());
        setExtractionStats(null);
      }
      
      setStep('form');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Erreur lors de l'analyse IA - formulaire vierge");
      setFormData({ 
        title: "",
        tender_type: tenderType,
        submission_type: 'candidature_offre',
        criteria: [],
        required_team: [],
      });
      setAiFilledFields(new Set());
      setExtractionStats(null);
      setStep('form');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  // Skip analysis and go directly to form
  const handleSkipAnalysis = () => {
    setFormData({ 
      title: "",
      tender_type: tenderType,
      submission_type: 'candidature_offre',
      criteria: [],
      required_team: [],
    });
    setAiFilledFields(new Set());
    setExtractionStats(null);
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
        pipeline_status: 'a_approuver',
        tender_type: formData.tender_type || 'architecture',
        submission_type: formData.submission_type || 'candidature_offre',
        client_name: formData.client_name || undefined,
        client_type: formData.client_type || undefined,
        moa_company_id: formData.moa_company_id || undefined,
        location: formData.location || undefined,
        estimated_budget: formData.estimated_budget || undefined,
        procedure_type: formData.procedure_type || undefined,
        procedure_other: formData.procedure_other || undefined,
        submission_deadline: formData.submission_deadline || undefined,
        site_visit_date: formData.site_visit_date || undefined,
        site_visit_required: formData.site_visit_required || undefined,
        site_visit_assigned_user_id: formData.site_visit_assigned_user_id || undefined,
        dce_link: formData.dce_link || undefined,
        description: formData.project_description || undefined,
      });

      // Store files and criteria for upload on detail page
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

      // Store criteria to be created on detail page
      if (formData.criteria && formData.criteria.length > 0) {
        sessionStorage.setItem(`tender-criteria-${result.id}`, JSON.stringify(formData.criteria));
      }

      // Store required team to be created on detail page
      if (formData.required_team && formData.required_team.length > 0) {
        sessionStorage.setItem(`tender-team-${result.id}`, JSON.stringify(formData.required_team));
      }

      handleClose();
      navigate(`/tenders/${result.id}?autoUpload=true`);
      toast.success("Appel d'offre créé avec succès");
    } catch (error) {
      console.error('Create error:', error);
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset dialog state
  const handleClose = () => {
    setStep('type');
    setTenderType('architecture');
    setUploadedFiles([]);
    setFormData({
      tender_type: 'architecture',
      submission_type: 'candidature_offre',
      criteria: [],
      required_team: [],
    });
    setIsAnalyzing(false);
    setIsCreating(false);
    onOpenChange(false);
  };

  const updateFormField = (field: keyof ExtractedInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goBack = () => {
    if (step === 'form') setStep('upload');
    else if (step === 'upload') setStep('type');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'type' && (
              <>
                <Sparkles className="h-5 w-5 text-primary" />
                Nouvel appel d'offre
              </>
            )}
            {step === 'upload' && (
              <>
                <Upload className="h-5 w-5 text-primary" />
                Documents DCE
              </>
            )}
            {step === 'form' && (
              <>
                <FileSearch className="h-5 w-5 text-primary" />
                Informations du marché
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' && "Choisissez le type d'appel d'offre"}
            {step === 'upload' && "Déposez vos documents DCE et l'IA extraira automatiquement les informations"}
            {step === 'form' && "Vérifiez et complétez les informations avant de créer l'appel d'offre"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Type Selection */}
          {step === 'type' && (
            <div className="space-y-6">
              <TenderTypeSelector value={tenderType} onChange={setTenderType} />
              
              <div className="flex justify-end">
                <Button onClick={() => setStep('upload')}>
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === 'upload' && (
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
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
                            {analysisProgress || "Lecture et compréhension des documents PDF"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">
                            Glissez vos fichiers DCE ici
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            ou cliquez pour sélectionner • PDF, Word, Excel, PowerPoint
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
                <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    L'IA expert architecture va extraire automatiquement :
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground ml-6">
                    <li className="list-disc">Titre et référence du marché</li>
                    <li className="list-disc">Maître d'ouvrage et contacts</li>
                    <li className="list-disc">Budget et surface</li>
                    <li className="list-disc">Date limite et visite de site</li>
                    <li className="list-disc">Critères de jugement (pondérations)</li>
                    <li className="list-disc">Équipe MOE requise</li>
                    <li className="list-disc">Phases de mission demandées</li>
                    <li className="list-disc">Pièces à remettre</li>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={goBack} disabled={isAnalyzing}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleSkipAnalysis} disabled={isAnalyzing}>
                    Passer l'analyse
                  </Button>
                  <Button onClick={handleAnalyzeFiles} disabled={isAnalyzing || uploadedFiles.length === 0}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyser avec l'IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Form */}
          {step === 'form' && (
            <div className="space-y-6">
              {/* Success message if AI extracted data */}
              {aiFilledFields.size > 0 && uploadedFiles.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-emerald-500/20 shrink-0">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">
                        Analyse IA terminée - Documents lus et analysés
                      </p>
                      <div className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                        {extractionStats && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span>📄 {extractionStats.files_analyzed} fichier(s) analysé(s)</span>
                            {extractionStats.criteria_found > 0 && (
                              <span>⚖️ {extractionStats.criteria_found} critère(s) extrait(s)</span>
                            )}
                            {extractionStats.team_requirements > 0 && (
                              <span>👥 {extractionStats.team_requirements} compétence(s) requise(s)</span>
                            )}
                            {extractionStats.alerts_found > 0 && (
                              <span>⚠️ {extractionStats.alerts_found} alerte(s)</span>
                            )}
                          </div>
                        )}
                        <p className="mt-1">
                          {aiFilledFields.size} champ(s) pré-remplis par l'IA. Vérifiez et ajustez si nécessaire.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Critical alerts from AI */}
              {formData.critical_alerts && formData.critical_alerts.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                  <p className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    ⚠️ Points d'attention identifiés par l'IA
                  </p>
                  <ul className="space-y-1 text-sm">
                    {formData.critical_alerts.map((alert, i) => (
                      <li key={i} className={cn(
                        "flex items-start gap-2",
                        alert.severity === 'critical' && "text-red-600 dark:text-red-400",
                        alert.severity === 'warning' && "text-amber-600 dark:text-amber-400",
                        alert.severity === 'info' && "text-muted-foreground"
                      )}>
                        <span className="shrink-0">
                          {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟠' : '🔵'}
                        </span>
                        <span>{alert.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informations générales
                </h3>
                
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Titre du marché *
                    {aiFilledFields.has('title') && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                        <Sparkles className="h-3 w-3 mr-0.5" />IA
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    placeholder="Ex: Construction d'un groupe scolaire"
                    className={cn("mt-1", aiFilledFields.has('title') && "border-primary/30")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reference">Réf. Achat</Label>
                    <Input
                      id="reference"
                      value={formData.reference || ''}
                      onChange={(e) => updateFormField('reference', e.target.value)}
                      placeholder="Ex: MAPA-2024-015"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="submission_type">Type de soumission</Label>
                    <Select
                      value={formData.submission_type || 'candidature_offre'}
                      onValueChange={(value) => updateFormField('submission_type', value as SubmissionType)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SUBMISSION_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  {formData.procedure_type === 'autre' && (
                    <div>
                      <Label htmlFor="procedure_other">Préciser</Label>
                      <Input
                        id="procedure_other"
                        value={formData.procedure_other || ''}
                        onChange={(e) => updateFormField('procedure_other', e.target.value)}
                        placeholder="Type de procédure..."
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* MOA */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Maître d'ouvrage
                </h3>
                <MOASelector
                  value={formData.moa_company_id || null}
                  clientName={formData.client_name || null}
                  onChange={(companyId, clientName) => {
                    updateFormField('moa_company_id', companyId);
                    updateFormField('client_name', clientName);
                    if (companyId) {
                      updateFormField('client_type', 'client_public');
                    }
                  }}
                />
              </div>

              {/* Location & Budget */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Localisation du projet
                      {aiFilledFields.has('location') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20 ml-1">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => updateFormField('location', e.target.value)}
                      placeholder="Ex: Paris 75001"
                      className={cn("mt-1", aiFilledFields.has('location') && "border-primary/30")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget" className="flex items-center gap-1.5">
                      <Euro className="h-3.5 w-3.5" />
                      Budget estimé (€ HT)
                      {aiFilledFields.has('estimated_budget') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20 ml-1">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.estimated_budget || ''}
                      onChange={(e) => updateFormField('estimated_budget', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Ex: 5000000"
                      className={cn("mt-1", aiFilledFields.has('estimated_budget') && "border-primary/30")}
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dates et délais
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deadline" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Date/heure limite dépôt
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.submission_deadline || ''}
                      onChange={(e) => updateFormField('submission_deadline', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dce_link" className="flex items-center gap-1.5">
                      <Link className="h-3.5 w-3.5" />
                      Lien DCE
                    </Label>
                    <Input
                      id="dce_link"
                      type="url"
                      value={formData.dce_link || ''}
                      onChange={(e) => updateFormField('dce_link', e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Site Visit */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="site_visit" className="font-medium">
                      Visite obligatoire
                    </Label>
                    <Switch
                      id="site_visit"
                      checked={formData.site_visit_required || false}
                      onCheckedChange={(checked) => updateFormField('site_visit_required', checked)}
                    />
                  </div>
                  
                  {formData.site_visit_required && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="visit_date">Date de visite</Label>
                        <Input
                          id="visit_date"
                          type="datetime-local"
                          value={formData.site_visit_date || ''}
                          onChange={(e) => updateFormField('site_visit_date', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="visit_user">Membre assigné</Label>
                        <Select
                          value={formData.site_visit_assigned_user_id || ''}
                          onValueChange={(value) => updateFormField('site_visit_assigned_user_id', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner un membre..." />
                          </SelectTrigger>
                          <SelectContent>
                            {members?.map((member) => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.profile?.full_name || member.user_id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Criteria */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Critères d'évaluation
                </h3>
                <CriteriaWeightEditor
                  criteria={formData.criteria || []}
                  onChange={(criteria) => updateFormField('criteria', criteria)}
                />
              </div>

              {/* Required Team */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Équipe MOE demandée
                </h3>
                <RequiredTeamEditor
                  team={formData.required_team || []}
                  onChange={(team) => updateFormField('required_team', team)}
                  companies={companies?.filter(c => 
                    c.industry === 'bet' || 
                    c.industry === 'partenaire_moe' ||
                    c.industry?.includes('bet') ||
                    c.bet_specialties?.length
                  ) || []}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <Button onClick={handleCreateTender} disabled={isCreating || !formData.title?.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Créer l'appel d'offre
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}