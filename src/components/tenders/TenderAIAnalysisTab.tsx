import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  Euro,
  MapPin,
  Building2,
  Users,
  Scale,
  Clock,
  FileCheck,
  ArrowRight,
  Zap,
  Eye,
  Download,
  Brain,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { useTenders } from "@/hooks/useTenders";
import { DOCUMENT_TYPE_LABELS } from "@/lib/tenderTypes";
import type { Tender } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface TenderAIAnalysisTabProps {
  tender: Tender;
  onNavigateToTab: (tab: string) => void;
  pendingFiles?: Array<{ name: string; type: string; data: string }> | null;
  onFilesPending?: (files: null) => void;
}

// Auto-detect document type from filename
function detectDocumentType(filename: string): string {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('rc') || lowerName.includes('reglement') || lowerName.includes('consultation')) return 'rc';
  if (lowerName.includes('ccap') || lowerName.includes('clauses_administratives')) return 'ccap';
  if (lowerName.includes('cctp') || lowerName.includes('clauses_techniques')) return 'cctp';
  if (lowerName.includes('lettre') && lowerName.includes('consultation')) return 'lettre_consultation';
  if (lowerName.includes('note') || lowerName.includes('programme')) return 'note_programme';
  if (lowerName.includes('attestation') && lowerName.includes('visite')) return 'attestation_visite';
  if (lowerName.includes('audit') || lowerName.includes('diagnostic')) return 'audit_technique';
  if (lowerName.includes('dpgf') || lowerName.includes('bpu') || lowerName.includes('dqe')) return 'dpgf';
  if (lowerName.includes('plan') || lowerName.match(/\.(dwg|dxf)$/)) return 'plan';
  if (lowerName.includes('contrat') || lowerName.includes('_ae')) return 'contrat';
  
  return 'autre';
}

export function TenderAIAnalysisTab({ tender, onNavigateToTab, pendingFiles, onFilesPending }: TenderAIAnalysisTabProps) {
  const { documents, isLoading, uploadDocument, analyzeDocument } = useTenderDocuments(tender.id);
  const { updateTender } = useTenders();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAutoUploading, setIsAutoUploading] = useState(false);

  // Handle pending files from creation dialog
  useEffect(() => {
    if (pendingFiles && pendingFiles.length > 0 && !isAutoUploading) {
      setIsAutoUploading(true);
      
      const uploadPendingFiles = async () => {
        for (const fileData of pendingFiles) {
          // Convert base64 back to blob
          const binaryString = atob(fileData.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: fileData.type });
          const file = new File([blob], fileData.name, { type: fileData.type });
          
          const docType = detectDocumentType(file.name);
          await uploadDocument.mutateAsync({ file, documentType: docType });
        }
        
        // Clear pending files
        onFilesPending?.(null);
        setIsAutoUploading(false);
      };
      
      uploadPendingFiles();
    }
  }, [pendingFiles, isAutoUploading, uploadDocument, onFilesPending]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const docType = detectDocumentType(file.name);
      uploadDocument.mutate({ file, documentType: docType });
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const docType = detectDocumentType(file.name);
        uploadDocument.mutate({ file, documentType: docType });
      });
    }
    e.target.value = '';
  };

  const analyzedDocs = documents.filter(d => d.is_analyzed);
  const notAnalyzedDocs = documents.filter(d => !d.is_analyzed);
  
  // Merge all extracted data
  const mergedExtractedData = analyzedDocs.reduce((acc, doc) => {
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      return { ...acc, ...(doc.extracted_data as Record<string, unknown>) };
    }
    return acc;
  }, {} as Record<string, unknown>);

  const hasDocuments = documents.length > 0;
  const hasAnalyzedDocs = analyzedDocs.length > 0;
  const allAnalyzed = hasDocuments && notAnalyzedDocs.length === 0;

  // Calculate what was extracted
  const extractedFields = {
    dates: !!(mergedExtractedData.submission_deadline || mergedExtractedData.dates),
    budget: !!(mergedExtractedData.budget || mergedExtractedData.estimated_budget),
    criteria: !!(mergedExtractedData.criteria || mergedExtractedData.judgment_criteria),
    client: !!(mergedExtractedData.client || mergedExtractedData.client_name),
    location: !!(mergedExtractedData.location || mergedExtractedData.project_location),
    siteVisit: !!(mergedExtractedData.site_visit || mergedExtractedData.site_visit_required),
    requiredDocs: !!(mergedExtractedData.required_documents || mergedExtractedData.pieces_a_remettre),
    team: !!(mergedExtractedData.required_competencies || mergedExtractedData.team_requirements),
  };

  const extractedCount = Object.values(extractedFields).filter(Boolean).length;
  const extractionProgress = hasAnalyzedDocs ? Math.round((extractedCount / 8) * 100) : 0;

  // Analyze all documents
  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    try {
      for (let i = 0; i < notAnalyzedDocs.length; i++) {
        setAnalysisStep(i + 1);
        await analyzeDocument.mutateAsync(notAnalyzedDocs[i].id);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply extracted data to tender (including title and reference)
  const handleApplyExtractedData = async () => {
    const updates: Partial<Tender> = {};
    
    // Title and reference - AI can now modify these
    if (mergedExtractedData.title || mergedExtractedData.market_title) {
      const newTitle = (mergedExtractedData.title || mergedExtractedData.market_title) as string;
      if (newTitle && tender.title === "Nouveau concours - En attente d'analyse IA") {
        updates.title = newTitle;
      }
    }
    if (mergedExtractedData.reference || mergedExtractedData.consultation_number) {
      const newRef = (mergedExtractedData.reference || mergedExtractedData.consultation_number) as string;
      if (newRef && tender.reference.startsWith('AO-')) {
        updates.reference = newRef;
      }
    }
    
    // Map extracted fields to tender fields
    if (mergedExtractedData.client_name && !tender.client_name) {
      updates.client_name = mergedExtractedData.client_name as string;
    }
    if (mergedExtractedData.location && !tender.location) {
      updates.location = mergedExtractedData.location as string;
    }
    if (mergedExtractedData.estimated_budget && !tender.estimated_budget) {
      updates.estimated_budget = mergedExtractedData.estimated_budget as number;
    }
    if (mergedExtractedData.submission_deadline && !tender.submission_deadline) {
      updates.submission_deadline = mergedExtractedData.submission_deadline as string;
    }
    if (mergedExtractedData.site_visit_required !== undefined && tender.site_visit_required === null) {
      updates.site_visit_required = mergedExtractedData.site_visit_required as boolean;
    }
    if (mergedExtractedData.site_visit_date && !tender.site_visit_date) {
      updates.site_visit_date = mergedExtractedData.site_visit_date as string;
    }
    if (mergedExtractedData.offer_validity_days && !tender.offer_validity_days) {
      updates.offer_validity_days = mergedExtractedData.offer_validity_days as number;
    }
    if (mergedExtractedData.procedure_type && !tender.procedure_type) {
      (updates as any).procedure_type = mergedExtractedData.procedure_type as string;
    }

    if (Object.keys(updates).length > 0) {
      updateTender.mutate({ id: tender.id, ...updates } as any);
    }
  };

  // Key info cards
  const keyInfoCards = [
    {
      icon: Calendar,
      label: "Date limite",
      value: tender.submission_deadline 
        ? format(new Date(tender.submission_deadline), "dd MMM yyyy HH:mm", { locale: fr })
        : mergedExtractedData.submission_deadline 
          ? format(new Date(mergedExtractedData.submission_deadline as string), "dd MMM yyyy", { locale: fr })
          : null,
      extracted: !tender.submission_deadline && !!mergedExtractedData.submission_deadline,
    },
    {
      icon: Euro,
      label: "Budget",
      value: tender.estimated_budget 
        ? `${(tender.estimated_budget / 1000000).toFixed(2)}M€`
        : mergedExtractedData.estimated_budget
          ? `${((mergedExtractedData.estimated_budget as number) / 1000000).toFixed(2)}M€`
          : null,
      extracted: !tender.estimated_budget && !!mergedExtractedData.estimated_budget,
    },
    {
      icon: Building2,
      label: "Maître d'ouvrage",
      value: tender.client_name || (mergedExtractedData.client_name as string) || null,
      extracted: !tender.client_name && !!mergedExtractedData.client_name,
    },
    {
      icon: MapPin,
      label: "Localisation",
      value: tender.location || (mergedExtractedData.location as string) || null,
      extracted: !tender.location && !!mergedExtractedData.location,
    },
  ];

  // Offer validity end date
  const submissionDeadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
  const offerValidityEndDate = submissionDeadline && tender.offer_validity_days
    ? addDays(submissionDeadline, tender.offer_validity_days)
    : null;

  return (
    <div className="space-y-6">
      {/* Step 1: Upload DCE */}
      <Card className={cn(
        "transition-all",
        !hasDocuments && "border-primary/50 bg-primary/5"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                hasDocuments ? "bg-green-500/10" : "bg-primary/10"
              )}>
                {hasDocuments ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Upload className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">1. Télécharger le DCE</CardTitle>
                <CardDescription>
                  {hasDocuments 
                    ? `${documents.length} document${documents.length > 1 ? 's' : ''} téléchargé${documents.length > 1 ? 's' : ''}`
                    : "Glissez-déposez tous les documents du DCE"
                  }
                </CardDescription>
              </div>
            </div>
            {hasDocuments && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                Complété
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('dce-upload')?.click()}
          >
            <input
              type="file"
              id="dce-upload"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
            />
            {uploadDocument.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  RC, CCAP, CCTP, Note programme, Audit technique...
                </p>
              </>
            )}
          </div>

          {/* Document chips */}
          {hasDocuments && (
            <div className="flex flex-wrap gap-2 mt-4">
              {documents.map(doc => (
                <Badge 
                  key={doc.id} 
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    doc.is_analyzed && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  )}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                  {doc.is_analyzed && <CheckCircle2 className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: AI Analysis */}
      <Card className={cn(
        "transition-all",
        hasDocuments && !allAnalyzed && "border-primary/50 bg-primary/5"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                allAnalyzed ? "bg-green-500/10" : hasDocuments ? "bg-primary/10" : "bg-muted"
              )}>
                {allAnalyzed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Brain className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">2. Analyse IA automatique</CardTitle>
                <CardDescription>
                  {allAnalyzed 
                    ? "Tous les documents ont été analysés"
                    : hasDocuments
                      ? `${notAnalyzedDocs.length} document${notAnalyzedDocs.length > 1 ? 's' : ''} à analyser`
                      : "Téléchargez d'abord le DCE"
                  }
                </CardDescription>
              </div>
            </div>
            {allAnalyzed ? (
              <Badge variant="outline" className="text-green-600 border-green-300">
                Complété
              </Badge>
            ) : (
              <Button 
                onClick={handleAnalyzeAll}
                disabled={!hasDocuments || isAnalyzing || notAnalyzedDocs.length === 0}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse {analysisStep}/{notAnalyzedDocs.length}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Lancer l'analyse
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        
        {hasAnalyzedDocs && (
          <CardContent className="space-y-4">
            {/* Extraction progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Informations extraites</span>
                <span className="font-medium">{extractedCount}/8</span>
              </div>
              <Progress value={extractionProgress} className="h-2" />
            </div>

            {/* Key info cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {keyInfoCards.map((info, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border",
                    info.extracted && "border-amber-300 bg-amber-50 dark:bg-amber-900/10"
                  )}
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <info.icon className="h-4 w-4" />
                    <span className="text-xs">{info.label}</span>
                    {info.extracted && (
                      <Badge variant="outline" className="text-xs py-0 text-amber-600 border-amber-300">
                        Extrait
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium truncate">
                    {info.value || <span className="text-muted-foreground">Non défini</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Site visit info */}
            {(tender.site_visit_required !== null || extractedFields.siteVisit) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">Visite de site: </span>
                  <Badge variant={tender.site_visit_required ? "default" : "secondary"}>
                    {tender.site_visit_required ? "Obligatoire" : "Non requise"}
                  </Badge>
                  {tender.site_visit_date && (
                    <span className="text-sm text-muted-foreground ml-2">
                      le {format(new Date(tender.site_visit_date), "dd MMM yyyy", { locale: fr })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Offer validity end date */}
            {offerValidityEndDate && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <span className="font-medium">Fin de validité des offres: </span>
                  <span>{format(offerValidityEndDate, "dd MMM yyyy", { locale: fr })}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({tender.offer_validity_days} jours)
                  </span>
                </div>
              </div>
            )}

            {/* Apply button */}
            {Object.keys(mergedExtractedData).length > 0 && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleApplyExtractedData}
              >
                <Zap className="h-4 w-4 mr-2" />
                Appliquer les données extraites au concours
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Step 3: Next steps */}
      {hasAnalyzedDocs && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Required documents */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onNavigateToTab('deliverables')}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <ListChecks className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">3. Pièces à fournir</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {extractedFields.requiredDocs 
                      ? "Liste extraite du DCE"
                      : "Définir les documents requis"
                    }
                  </p>
                  <div className="flex items-center text-sm text-primary">
                    Gérer les pièces
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team composition */}
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onNavigateToTab('team')}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">4. Équipe projet</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {extractedFields.team 
                      ? "Compétences requises identifiées"
                      : "Constituer le groupement"
                    }
                  </p>
                  <div className="flex items-center text-sm text-primary">
                    Gérer l'équipe
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Extracted judgment criteria preview */}
      {hasAnalyzedDocs && extractedFields.criteria && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Critères de jugement (extraits)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(mergedExtractedData.judgment_criteria) ? (
                (mergedExtractedData.judgment_criteria as Array<{ name?: string; weight?: number }>).map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{c.name}</span>
                    <Badge variant="secondary">{c.weight}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(mergedExtractedData.judgment_criteria)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
