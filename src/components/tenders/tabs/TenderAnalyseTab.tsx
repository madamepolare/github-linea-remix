import { useState, useEffect } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Brain,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { useTenders } from "@/hooks/useTenders";
import { DOCUMENT_TYPE_LABELS } from "@/lib/tenderTypes";
import type { Tender } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TenderAnalyseTabProps {
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

export function TenderAnalyseTab({ tender, onNavigateToTab, pendingFiles, onFilesPending }: TenderAnalyseTabProps) {
  const { documents, isLoading, uploadDocument, analyzeDocument } = useTenderDocuments(tender.id);
  const { updateTender } = useTenders();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAutoUploading, setIsAutoUploading] = useState(false);
  const [shouldAutoAnalyze, setShouldAutoAnalyze] = useState(false);

  const analyzedDocs = documents.filter(d => d.is_analyzed);
  const notAnalyzedDocs = documents.filter(d => !d.is_analyzed);
  
  // Handle pending files from creation dialog
  useEffect(() => {
    if (pendingFiles && pendingFiles.length > 0 && !isAutoUploading) {
      setIsAutoUploading(true);
      
      const uploadPendingFiles = async () => {
        try {
          for (const fileData of pendingFiles) {
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
          
          onFilesPending?.(null);
          setShouldAutoAnalyze(true);
        } catch (error) {
          console.error('Error uploading pending files:', error);
        } finally {
          setIsAutoUploading(false);
        }
      };
      
      uploadPendingFiles();
    }
  }, [pendingFiles, isAutoUploading, uploadDocument, onFilesPending]);

  // Analyze all documents function
  const runAnalysis = async (docsToAnalyze: typeof notAnalyzedDocs) => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    try {
      for (let i = 0; i < docsToAnalyze.length; i++) {
        setAnalysisStep(i + 1);
        await analyzeDocument.mutateAsync(docsToAnalyze[i].id);
      }
      toast.success("Analyse terminée");
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze after files are uploaded
  useEffect(() => {
    if (shouldAutoAnalyze && documents.length > 0 && notAnalyzedDocs.length > 0 && !isAnalyzing) {
      setShouldAutoAnalyze(false);
      runAnalysis(notAnalyzedDocs);
    }
  }, [shouldAutoAnalyze, documents.length, notAnalyzedDocs.length, isAnalyzing]);

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

  // Apply extracted data to tender
  const handleApplyExtractedData = async () => {
    const updates: Partial<Tender> = {};
    
    // Title and reference
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
    
    // Map extracted fields
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
    if (mergedExtractedData.procedure_type && !tender.procedure_type) {
      (updates as any).procedure_type = mergedExtractedData.procedure_type as string;
    }
    if (mergedExtractedData.description && !tender.description) {
      updates.description = mergedExtractedData.description as string;
    }
    if (mergedExtractedData.surface_area && !tender.surface_area) {
      updates.surface_area = mergedExtractedData.surface_area as number;
    }

    if (Object.keys(updates).length > 0) {
      updateTender.mutate({ id: tender.id, ...updates } as any);
      toast.success("Données appliquées à la synthèse");
      onNavigateToTab('synthese');
    } else {
      toast.info("Aucune nouvelle donnée à appliquer");
    }
  };

  // What was extracted
  const extractedItems = [
    { key: 'client_name', label: 'Maître d\'ouvrage', found: !!mergedExtractedData.client_name },
    { key: 'procedure_type', label: 'Type de marché', found: !!mergedExtractedData.procedure_type },
    { key: 'location', label: 'Lieu', found: !!mergedExtractedData.location },
    { key: 'budget', label: 'Budget', found: !!(mergedExtractedData.estimated_budget || mergedExtractedData.budget) },
    { key: 'deadline', label: 'Date de dépôt', found: !!mergedExtractedData.submission_deadline },
    { key: 'site_visit', label: 'Visite obligatoire', found: mergedExtractedData.site_visit_required !== undefined },
    { key: 'criteria', label: 'Critères de jugement', found: !!(mergedExtractedData.criteria || mergedExtractedData.judgment_criteria) },
    { key: 'team', label: 'Compétences requises', found: !!(mergedExtractedData.required_competencies || mergedExtractedData.team_requirements) },
  ];

  const extractedCount = extractedItems.filter(i => i.found).length;
  const extractionProgress = hasAnalyzedDocs ? Math.round((extractedCount / extractedItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Upload DCE */}
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
                <CardTitle className="text-lg">Télécharger le DCE</CardTitle>
                <CardDescription>
                  {hasDocuments 
                    ? `${documents.length} document${documents.length > 1 ? 's' : ''} téléchargé${documents.length > 1 ? 's' : ''}`
                    : "Glissez-déposez tous les documents du DCE (RC, CCTP, CCAP, Programme...)"
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
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('dce-upload-analyse')?.click()}
          >
            <input
              type="file"
              id="dce-upload-analyse"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
            />
            {uploadDocument.isPending || isAutoUploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Cliquez ou glissez-déposez vos fichiers ici
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Excel acceptés
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

      {/* AI Analysis */}
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
                <CardTitle className="text-lg">Lancer l'analyse IA</CardTitle>
                <CardDescription>
                  {allAnalyzed 
                    ? "L'IA a extrait les informations clés du DCE"
                    : hasDocuments
                      ? `${notAnalyzedDocs.length} document${notAnalyzedDocs.length > 1 ? 's' : ''} à analyser`
                      : "Téléchargez d'abord le DCE"
                  }
                </CardDescription>
              </div>
            </div>
            {!allAnalyzed && (
              <Button 
                onClick={() => runAnalysis(notAnalyzedDocs)}
                disabled={!hasDocuments || isAnalyzing || notAnalyzedDocs.length === 0}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse {analysisStep}/{notAnalyzedDocs.length}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Lancer l'analyse IA
                  </>
                )}
              </Button>
            )}
            {allAnalyzed && (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => runAnalysis(documents)}
                  disabled={isAnalyzing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réanalyser
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        {hasAnalyzedDocs && (
          <CardContent className="space-y-6">
            {/* Extraction progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Informations extraites</span>
                <span className="font-medium">{extractedCount}/{extractedItems.length}</span>
              </div>
              <Progress value={extractionProgress} className="h-2" />
            </div>

            {/* Extracted items grid */}
            <div className="grid gap-2 sm:grid-cols-2">
              {extractedItems.map(item => (
                <div 
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border",
                    item.found 
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                      : "bg-muted/50 border-border"
                  )}
                >
                  {item.found ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-sm", !item.found && "text-muted-foreground")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Apply to synthese button */}
            <div className="pt-4 border-t">
              <Button 
                onClick={handleApplyExtractedData}
                className="w-full"
                size="lg"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Appliquer à la synthèse
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Les données extraites seront ajoutées à l'onglet Synthèse. Vous pourrez les modifier ensuite.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Info about what AI writes */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Brain className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-medium mb-2">Ce que l'IA extrait automatiquement</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Synthèse :</strong> Budget, dates, lieu, maître d'ouvrage, description</li>
                <li>• <strong>Équipe :</strong> Compétences requises (BET, architecte, etc.)</li>
                <li>• <strong>Livrables :</strong> Pièces à fournir obligatoires et optionnelles</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Toutes les données restent modifiables. L'IA vous assiste, elle ne décide pas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
