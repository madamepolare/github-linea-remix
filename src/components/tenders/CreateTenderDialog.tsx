import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import JSZip from "jszip";
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
  Archive,
  Layers,
  Mic,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  normalizeProcedureType,
  type SubmissionType,
  type CriterionType,
} from "@/lib/tenderTypes";
import { type DisciplineSlug } from "@/lib/tenderDisciplineConfig";
import { DisciplineTenderSelector } from "./DisciplineTenderSelector";
import { MOASelector } from "./MOASelector";
import { CriteriaWeightEditor, type CriterionItem } from "./CriteriaWeightEditor";
import { RequiredTeamEditor, type RequiredTeamItem } from "./RequiredTeamEditor";
import { CommunicationLotsEditor, type TenderLot } from "./CommunicationLotsEditor";
import { CasPratiqueEditor, type CasPratique } from "./CasPratiqueEditor";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useDisciplineConfig } from "@/hooks/useTenderDisciplineConfig";

interface SiteVisitSlot {
  date: string;
  time: string;
  notes?: string;
}

interface Audition {
  prevue: boolean;
  date?: string;
  duree_minutes?: number;
  format?: string;
}

interface ExtractedInfo {
  title?: string;
  reference?: string;
  discipline_slug?: DisciplineSlug;
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
  site_visit_slots?: SiteVisitSlot[];
  site_visit_notes?: string;
  dce_link?: string;
  dce_url?: string;
  project_description?: string;
  ai_summary?: string;
  surface_area?: number;
  moe_phases?: string[];
  criteria?: CriterionItem[];
  required_team?: RequiredTeamItem[];
  critical_alerts?: Array<{ type: string; message: string; severity: string; source?: string }>;
  detected_documents?: { filename: string; type: string }[];
  // Communication-specific fields
  is_multi_attributaire?: boolean;
  nb_attributaires?: number;
  lots?: TenderLot[];
  montant_minimum?: number;
  montant_maximum?: number;
  duree_initiale_mois?: number;
  nb_reconductions?: number;
  duree_reconduction_mois?: number;
  date_debut_mission?: string;
  validite_offre_jours?: number;
  cas_pratique?: CasPratique;
  audition?: Audition;
  anciens_prestataires?: string[];
  type_campagne?: string;
  cibles?: string[];
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

type Step = 'discipline' | 'upload' | 'form';

export function CreateTenderDialog({ open, onOpenChange }: CreateTenderDialogProps) {
  const navigate = useNavigate();
  const { createTender } = useTenders();
  const { companies } = useCRMCompanies();
  const { data: members } = useTeamMembers();
  
  // Step management
  const [step, setStep] = useState<Step>('discipline');
  
  // Discipline selection
  const [disciplineSlug, setDisciplineSlug] = useState<DisciplineSlug>('architecture');
  
  // Get discipline config for dynamic labels
  const { config: disciplineConfig } = useDisciplineConfig(disciplineSlug);
  
  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>("");
  const [analysisPercent, setAnalysisPercent] = useState(0);
  
  // Form state (pre-filled by AI)
  const [formData, setFormData] = useState<ExtractedInfo>({
    discipline_slug: 'architecture',
    submission_type: 'candidature_offre',
    criteria: [],
    required_team: [],
    lots: [],
    cas_pratique: { requis: false },
    audition: { prevue: false },
    anciens_prestataires: [],
  });
  const [extractionStats, setExtractionStats] = useState<ExtractionStats | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [newPrestataire, setNewPrestataire] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32KB
    let binary = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  };

  const fileToBase64 = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer();
    return arrayBufferToBase64(buf);
  };

  const safeMimeType = (file: File): string => {
    if (file.type && file.type !== "application/octet-stream") return file.type;
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.doc')) return 'application/msword';
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (name.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (name.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (name.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
    if (name.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (name.endsWith('.zip')) return 'application/zip';
    return 'application/octet-stream';
  };

  // Extract files from ZIP archive
  const extractZipFiles = async (zipFile: File): Promise<File[]> => {
    try {
      const zip = await JSZip.loadAsync(zipFile);
      const extractedFiles: File[] = [];
      const supportedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
      
      const entries = Object.entries(zip.files);
      for (const [path, entry] of entries) {
        if (entry.dir) continue;
        
        const ext = path.split('.').pop()?.toLowerCase();
        if (!ext || !supportedExtensions.includes(ext)) continue;
        
        // Skip hidden/system files
        const fileName = path.split('/').pop() || path;
        if (fileName.startsWith('.') || fileName.startsWith('__')) continue;
        
        try {
          const blob = await entry.async('blob');
          const file = new File([blob], fileName, {
            type: safeMimeType({ name: fileName } as File)
          });
          extractedFiles.push(file);
        } catch (e) {
          console.warn(`Failed to extract ${path}:`, e);
        }
      }
      
      return extractedFiles;
    } catch (e) {
      console.error('Failed to extract ZIP:', e);
      return [];
    }
  };

  const safeFileList = (files: File[]) => {
    const MAX_FILES = 10;
    const MAX_FILE_SIZE_MB = 20;
    const selected = files.slice(0, MAX_FILES);

    const kept: File[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];

    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        skipped.push({ name: f.name, reason: `Fichier > ${MAX_FILE_SIZE_MB}MB` });
        continue;
      }
      kept.push(f);
    }

    return { kept, skipped };
  };

  const formatSkipped = (skipped: Array<{ name: string; reason: string }>) => {
    if (skipped.length === 0) return "";
    return ` (ignorés: ${skipped.map(s => `${s.name} - ${s.reason}`).join(', ')})`;
  };

  const markManualField = (field: keyof ExtractedInfo) => {
    setAiFilledFields(prev => {
      if (!prev.has(field as string)) return prev;
      const next = new Set(prev);
      next.delete(field as string);
      return next;
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    
    // Handle ZIP files
    const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
    const regularFiles = files.filter(f => !f.name.toLowerCase().endsWith('.zip'));
    
    // Extract files from ZIPs
    let extractedFromZip: File[] = [];
    for (const zipFile of zipFiles) {
      const extracted = await extractZipFiles(zipFile);
      extractedFromZip = [...extractedFromZip, ...extracted];
    }
    
    if (extractedFromZip.length > 0) {
      toast.success(`${extractedFromZip.length} fichier(s) extrait(s) du ZIP`);
    }
    
    const validFiles = regularFiles.filter(f =>
      f.type === 'application/pdf' ||
      f.type.includes('word') ||
      f.type.includes('excel') ||
      f.type.includes('spreadsheet') ||
      f.type.includes('powerpoint') ||
      f.type.includes('presentation')
    );
    
    const allFiles = [...validFiles, ...extractedFromZip];
    if (allFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...allFiles]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Handle ZIP files
      const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
      const regularFiles = files.filter(f => !f.name.toLowerCase().endsWith('.zip'));
      
      // Extract files from ZIPs
      let extractedFromZip: File[] = [];
      for (const zipFile of zipFiles) {
        const extracted = await extractZipFiles(zipFile);
        extractedFromZip = [...extractedFromZip, ...extracted];
      }
      
      if (extractedFromZip.length > 0) {
        toast.success(`${extractedFromZip.length} fichier(s) extrait(s) du ZIP`);
      }
      
      const allFiles = [...regularFiles, ...extractedFromZip];
      setUploadedFiles(prev => [...prev, ...allFiles]);
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
    setAnalysisPercent(5);

    try {
      // Prepare files with progress feedback
      setAnalysisProgress(`Lecture de ${uploadedFiles.length} fichier(s)...`);
      setAnalysisPercent(10);
      
      const { kept, skipped } = safeFileList(uploadedFiles);
      setAnalysisProgress(`Encodage de ${kept.length} fichier(s)...${formatSkipped(skipped)}`);
      setAnalysisPercent(15);

      const filesData = await Promise.all(kept.map(async (file) => ({
        name: file.name,
        type: safeMimeType(file),
        content: await fileToBase64(file),
      })));

      setAnalysisProgress("Envoi des fichiers au serveur...");
      setAnalysisPercent(25);

      // Start a progress simulation for the AI analysis phase
      const progressInterval = setInterval(() => {
        setAnalysisPercent(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 2000);

      setAnalysisProgress("Analyse IA en cours... Lecture des documents PDF");

      const { data, error } = await supabase.functions.invoke('analyze-dce-before-creation', {
        body: { files: filesData, discipline_slug: disciplineSlug }
      });

      clearInterval(progressInterval);
      setAnalysisPercent(95);
      setAnalysisProgress("Traitement des résultats...");

      if (error) throw error;

      if (data?.extractedData) {
        // Track which fields were filled by AI
        const filledFields = new Set<string>();
        const extracted = data.extractedData;
        
        // Combine date and time for submission deadline
        if (extracted.submission_deadline && extracted.submission_time) {
          extracted.submission_deadline = `${extracted.submission_deadline}T${extracted.submission_time}`;
        }
        
        // Combine date and time for site visit
        if (extracted.site_visit_date && extracted.site_visit_time) {
          extracted.site_visit_date = `${extracted.site_visit_date}T${extracted.site_visit_time}`;
        }
        
        // Map dce_url to dce_link if present
        if (extracted.dce_url && !extracted.dce_link) {
          extracted.dce_link = extracted.dce_url;
        }
        
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
        if (extracted.dce_link || extracted.dce_url) filledFields.add('dce_link');
        if (extracted.site_visit_slots?.length > 0) filledFields.add('site_visit_slots');
        // Communication-specific fields
        if (extracted.is_multi_attributaire !== undefined) filledFields.add('is_multi_attributaire');
        if (extracted.lots?.length > 0) filledFields.add('lots');
        if (extracted.montant_minimum || extracted.montant_maximum) filledFields.add('montant');
        if (extracted.duree_initiale_mois) filledFields.add('duree_initiale_mois');
        if (extracted.validite_offre_jours) filledFields.add('validite_offre_jours');
        if (extracted.cas_pratique?.requis) filledFields.add('cas_pratique');
        if (extracted.audition?.prevue) filledFields.add('audition');
        if (extracted.anciens_prestataires?.length > 0) filledFields.add('anciens_prestataires');
        if (extracted.type_campagne) filledFields.add('type_campagne');
        if (extracted.cibles?.length > 0) filledFields.add('cibles');
        
        setAiFilledFields(filledFields);
        setExtractionStats(data.stats || null);
        
        // Normalize procedure_type from AI extraction to valid enum value
        const normalizedProcedureType = normalizeProcedureType(extracted.procedure_type);
        
        setFormData({
          ...extracted,
          discipline_slug: disciplineSlug,
          submission_type: extracted.submission_type || 'candidature_offre',
          procedure_type: normalizedProcedureType || undefined,
          criteria: extracted.criteria || [],
          required_team: extracted.required_team || [],
          lots: extracted.lots || [],
          cas_pratique: extracted.cas_pratique || { requis: false },
          audition: extracted.audition || { prevue: false },
          anciens_prestataires: extracted.anciens_prestataires || [],
        });
        
        const statsMsg = data.stats 
          ? `${data.stats.files_analyzed} fichiers analysés, ${data.stats.criteria_found} critères extraits`
          : "Données extraites";
        toast.success(`Analyse terminée ! ${statsMsg}`);
      } else {
        setFormData({ 
          title: "Nouvel appel d'offre",
          discipline_slug: disciplineSlug,
          submission_type: 'candidature_offre',
          criteria: [],
          required_team: [],
          lots: [],
          cas_pratique: { requis: false },
          audition: { prevue: false },
          anciens_prestataires: [],
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
        discipline_slug: disciplineSlug,
        submission_type: 'candidature_offre',
        criteria: [],
        required_team: [],
        lots: [],
        cas_pratique: { requis: false },
        audition: { prevue: false },
        anciens_prestataires: [],
      });
      setAiFilledFields(new Set());
      setExtractionStats(null);
      setStep('form');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
      setAnalysisPercent(0);
    }
  };

  // Skip analysis and go directly to form
  const handleSkipAnalysis = () => {
    setFormData({ 
      title: "",
      discipline_slug: disciplineSlug,
      submission_type: 'candidature_offre',
      criteria: [],
      required_team: [],
      lots: [],
      cas_pratique: { requis: false },
      audition: { prevue: false },
      anciens_prestataires: [],
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
        tender_type: (formData.discipline_slug === 'scenographie' ? 'scenographie' : 'architecture') as any,
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

      // Store criteria to be created on detail page
      if (formData.criteria && formData.criteria.length > 0) {
        sessionStorage.setItem(`tender-criteria-${result.id}`, JSON.stringify(formData.criteria));
      }

      // Store required team to be created on detail page
      if (formData.required_team && formData.required_team.length > 0) {
        sessionStorage.setItem(`tender-team-${result.id}`, JSON.stringify(formData.required_team));
      }

      handleClose();
      navigate(`/tenders/${result.id}`);
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
    setStep('discipline');
    setDisciplineSlug('architecture');
    setUploadedFiles([]);
    setFormData({
      discipline_slug: 'architecture',
      submission_type: 'candidature_offre',
      criteria: [],
      required_team: [],
      lots: [],
      cas_pratique: { requis: false },
      audition: { prevue: false },
      anciens_prestataires: [],
    });
    setIsAnalyzing(false);
    setIsCreating(false);
    setNewPrestataire("");
    onOpenChange(false);
  };

  const updateFormField = (field: keyof ExtractedInfo, value: any) => {
    markManualField(field);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goBack = () => {
    if (step === 'form') setStep('upload');
    else if (step === 'upload') setStep('discipline');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'discipline' && (
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
            {step === 'discipline' && "Choisissez la discipline de l'appel d'offre"}
            {step === 'upload' && "Déposez vos documents DCE et l'IA extraira automatiquement les informations"}
            {step === 'form' && "Vérifiez et complétez les informations avant de créer l'appel d'offre"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Discipline Selection */}
          {step === 'discipline' && (
            <div className="space-y-6">
              <DisciplineTenderSelector value={disciplineSlug} onChange={setDisciplineSlug} />
              
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
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
                        <div className="space-y-3">
                          <p className="font-medium text-primary">Analyse IA en cours...</p>
                          <Progress value={analysisPercent} className="h-2 w-64 mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            {analysisProgress || "Lecture et compréhension des documents PDF"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Temps estimé : ~{Math.max(1, Math.ceil((100 - analysisPercent) / 10))} min restante(s)
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">
                            Glissez vos fichiers DCE ici
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-center">
                            ou cliquez pour sélectionner • PDF, Word, Excel, PowerPoint
                            <span className="inline-flex items-center gap-1 text-primary font-medium">
                              <Archive className="h-3.5 w-3.5" />
                              ou ZIP
                            </span>
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
                    {disciplineSlug === 'communication' 
                      ? "L'IA expert communication va extraire automatiquement :"
                      : "L'IA expert architecture va extraire automatiquement :"
                    }
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground ml-6">
                    <li className="list-disc">Titre et référence du marché</li>
                    <li className="list-disc">Maître d'ouvrage et contacts</li>
                    {disciplineSlug === 'communication' ? (
                      <>
                        <li className="list-disc">Lots et domaines (graphisme, digital...)</li>
                        <li className="list-disc">Multi-attributaires et montants</li>
                        <li className="list-disc">Cas pratique et brief</li>
                        <li className="list-disc">Audition (date, durée, format)</li>
                        <li className="list-disc">Anciens prestataires</li>
                        <li className="list-disc">Critères de notation</li>
                      </>
                    ) : (
                      <>
                        <li className="list-disc">Budget et surface</li>
                        <li className="list-disc">Date limite et visite de site</li>
                        <li className="list-disc">Critères de jugement (pondérations)</li>
                        <li className="list-disc">Équipe MOE requise</li>
                        <li className="list-disc">Phases de mission demandées</li>
                        <li className="list-disc">Pièces à remettre</li>
                      </>
                    )}
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
                  <ul className="space-y-2 text-sm">
                    {formData.critical_alerts.map((alert, i) => (
                      <li key={i} className={cn(
                        "flex items-start gap-2 p-2 rounded-lg",
                        alert.severity === 'critical' && "bg-red-100/50 dark:bg-red-900/20",
                        alert.severity === 'warning' && "bg-amber-100/50 dark:bg-amber-900/20",
                        alert.severity === 'info' && "bg-blue-100/50 dark:bg-blue-900/20"
                      )}>
                        <span className="shrink-0 mt-0.5">
                          {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟠' : '🔵'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            alert.severity === 'critical' && "text-red-700 dark:text-red-400",
                            alert.severity === 'warning' && "text-amber-700 dark:text-amber-400",
                            alert.severity === 'info' && "text-blue-700 dark:text-blue-400"
                          )}>{alert.message}</span>
                          {alert.source && (
                            <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              📄 {alert.source}
                            </span>
                          )}
                        </div>
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
                      {aiFilledFields.has('submission_deadline') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20 ml-1">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.submission_deadline || ''}
                      onChange={(e) => updateFormField('submission_deadline', e.target.value)}
                      className={cn("mt-1", aiFilledFields.has('submission_deadline') && "border-primary/30")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dce_link" className="flex items-center gap-1.5">
                      <Link className="h-3.5 w-3.5" />
                      Lien DCE
                      {aiFilledFields.has('dce_link') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20 ml-1">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="dce_link"
                      type="url"
                      value={formData.dce_link || ''}
                      onChange={(e) => updateFormField('dce_link', e.target.value)}
                      placeholder="https://..."
                      className={cn("mt-1", aiFilledFields.has('dce_link') && "border-primary/30")}
                    />
                  </div>
                </div>

                {/* Site Visit */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="site_visit" className="font-medium flex items-center gap-2">
                      Visite obligatoire
                      {aiFilledFields.has('site_visit_required') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </Label>
                    <Switch
                      id="site_visit"
                      checked={formData.site_visit_required || false}
                      onCheckedChange={(checked) => updateFormField('site_visit_required', checked)}
                    />
                  </div>
                  
                  {/* Site visit notes field */}
                  <div>
                    <Label htmlFor="site_visit_notes" className="text-sm">Note sur la visite</Label>
                    <Input
                      id="site_visit_notes"
                      value={formData.site_visit_notes || ''}
                      onChange={(e) => updateFormField('site_visit_notes', e.target.value)}
                      placeholder="Ex: Visite obligatoire uniquement en phase 2"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Précisez les conditions particulières de visite
                    </p>
                  </div>
                  
                  {/* Site Visit Slots - Quick selection */}
                  {formData.site_visit_required && formData.site_visit_slots && formData.site_visit_slots.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        Créneaux proposés
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.site_visit_slots.map((slot, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "text-xs",
                              formData.site_visit_date === `${slot.date}T${slot.time}` && "bg-primary/10 border-primary"
                            )}
                            onClick={() => {
                              updateFormField('site_visit_date', `${slot.date}T${slot.time}`);
                            }}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {slot.date} à {slot.time}
                            {slot.notes && <span className="ml-1 text-muted-foreground">({slot.notes})</span>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.site_visit_required && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="visit_date" className="flex items-center gap-1.5">
                          Date de visite
                          {aiFilledFields.has('site_visit_date') && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                              <Sparkles className="h-3 w-3 mr-0.5" />IA
                            </Badge>
                          )}
                        </Label>
                        <Input
                          id="visit_date"
                          type="datetime-local"
                          value={formData.site_visit_date || ''}
                          onChange={(e) => updateFormField('site_visit_date', e.target.value)}
                          className={cn("mt-1", aiFilledFields.has('site_visit_date') && "border-primary/30")}
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
                  {disciplineSlug === 'communication' ? 'Équipe demandée' : 'Équipe MOE demandée'}
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

              {/* Communication-specific fields */}
              {disciplineSlug === 'communication' && (
                <>
                  {/* Multi-attributaire & Lots */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Structure du marché
                      {aiFilledFields.has('lots') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </h3>

                    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Marché multi-attributaires</Label>
                        <Switch
                          checked={formData.is_multi_attributaire || false}
                          onCheckedChange={(checked) => updateFormField('is_multi_attributaire', checked)}
                        />
                      </div>

                      {formData.is_multi_attributaire && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Nombre d'attributaires</Label>
                            <Input
                              type="number"
                              value={formData.nb_attributaires || ''}
                              onChange={(e) => updateFormField('nb_attributaires', e.target.value ? Number(e.target.value) : undefined)}
                              placeholder="Ex: 3"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <CommunicationLotsEditor
                      lots={formData.lots || []}
                      onChange={(lots) => updateFormField('lots', lots)}
                    />

                    {/* Montants accord-cadre */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1.5">
                          <Euro className="h-3.5 w-3.5" />
                          Montant minimum (€ HT)
                          {aiFilledFields.has('montant') && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                              <Sparkles className="h-3 w-3 mr-0.5" />IA
                            </Badge>
                          )}
                        </Label>
                        <Input
                          type="number"
                          value={formData.montant_minimum || ''}
                          onChange={(e) => updateFormField('montant_minimum', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Optionnel"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1.5">
                          <Euro className="h-3.5 w-3.5" />
                          Montant maximum (€ HT)
                        </Label>
                        <Input
                          type="number"
                          value={formData.montant_maximum || ''}
                          onChange={(e) => updateFormField('montant_maximum', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Optionnel"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Durée et reconductions */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Durée du marché
                      {aiFilledFields.has('duree_initiale_mois') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </h3>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm">Durée initiale (mois)</Label>
                        <Input
                          type="number"
                          value={formData.duree_initiale_mois || ''}
                          onChange={(e) => updateFormField('duree_initiale_mois', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="12"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Nb. reconductions</Label>
                        <Input
                          type="number"
                          value={formData.nb_reconductions || ''}
                          onChange={(e) => updateFormField('nb_reconductions', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Durée reconduction (mois)</Label>
                        <Input
                          type="number"
                          value={formData.duree_reconduction_mois || ''}
                          onChange={(e) => updateFormField('duree_reconduction_mois', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="12"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm flex items-center gap-1.5">
                          Validité offre (jours)
                          {aiFilledFields.has('validite_offre_jours') && (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                              <Sparkles className="h-3 w-3 mr-0.5" />IA
                            </Badge>
                          )}
                        </Label>
                        <Input
                          type="number"
                          value={formData.validite_offre_jours || ''}
                          onChange={(e) => updateFormField('validite_offre_jours', e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="90"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cas pratique */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Cas pratique
                    </h3>
                    <CasPratiqueEditor
                      value={formData.cas_pratique || { requis: false }}
                      onChange={(value) => updateFormField('cas_pratique', value)}
                      aiFilledFields={aiFilledFields}
                    />
                  </div>

                  {/* Audition */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Audition / Présentation
                      {aiFilledFields.has('audition') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </h3>

                    <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Audition prévue</Label>
                        <Switch
                          checked={formData.audition?.prevue || false}
                          onCheckedChange={(checked) => updateFormField('audition', { ...formData.audition, prevue: checked })}
                        />
                      </div>

                      {formData.audition?.prevue && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm">Date prévue</Label>
                            <Input
                              type="date"
                              value={formData.audition?.date || ''}
                              onChange={(e) => updateFormField('audition', { ...formData.audition, date: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Durée (minutes)</Label>
                            <Input
                              type="number"
                              value={formData.audition?.duree_minutes || ''}
                              onChange={(e) => updateFormField('audition', { ...formData.audition, duree_minutes: e.target.value ? Number(e.target.value) : undefined })}
                              placeholder="45"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Format</Label>
                            <Select
                              value={formData.audition?.format || ''}
                              onValueChange={(value) => updateFormField('audition', { ...formData.audition, format: value })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="presentiel">Présentiel</SelectItem>
                                <SelectItem value="visio">Visioconférence</SelectItem>
                                <SelectItem value="hybride">Hybride</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anciens prestataires */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Anciens prestataires
                      {aiFilledFields.has('anciens_prestataires') && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-primary/10 border-primary/20">
                          <Sparkles className="h-3 w-3 mr-0.5" />IA
                        </Badge>
                      )}
                    </h3>

                    <div className="space-y-3">
                      {(formData.anciens_prestataires || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(formData.anciens_prestataires || []).map((presta, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                              {presta}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (formData.anciens_prestataires || []).filter((_, i) => i !== index);
                                  updateFormField('anciens_prestataires', updated);
                                }}
                                className="ml-1 p-0.5 rounded hover:bg-destructive/20"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={newPrestataire}
                          onChange={(e) => setNewPrestataire(e.target.value)}
                          placeholder="Nom d'un ancien prestataire..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newPrestataire.trim()) {
                              e.preventDefault();
                              updateFormField('anciens_prestataires', [...(formData.anciens_prestataires || []), newPrestataire.trim()]);
                              setNewPrestataire("");
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (newPrestataire.trim()) {
                              updateFormField('anciens_prestataires', [...(formData.anciens_prestataires || []), newPrestataire.trim()]);
                              setNewPrestataire("");
                            }
                          }}
                          disabled={!newPrestataire.trim()}
                        >
                          Ajouter
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connaître les anciens titulaires peut aider à évaluer la concurrence
                      </p>
                    </div>
                  </div>
                </>
              )}

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