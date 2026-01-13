import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  Loader2,
  Sparkles,
  Send,
  CheckCircle2,
  FolderOpen,
  File,
  RefreshCw,
  MessageCircle,
  Bot,
  FileSearch,
  X,
  Brain,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { useTenders } from "@/hooks/useTenders";
import { DOCUMENT_TYPE_LABELS } from "@/lib/tenderTypes";
import type { Tender } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenderDocumentsTabProps {
  tender: Tender;
  onNavigateToTab: (tab: string) => void;
}

// Group documents by type
function groupDocumentsByType(documents: any[]) {
  const groups: Record<string, any[]> = {};
  
  documents.forEach(doc => {
    const type = doc.document_type || 'autre';
    if (!groups[type]) groups[type] = [];
    groups[type].push(doc);
  });
  
  return groups;
}

// Document type order for display
const TYPE_ORDER = ['rc', 'ccap', 'cctp', 'note_programme', 'audit_technique', 'dpgf', 'plan', 'autre'];

// Auto-detect document type from filename
function detectDocumentType(filename: string): string {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('rc') || lowerName.includes('reglement') || lowerName.includes('consultation')) return 'rc';
  if (lowerName.includes('ccap') || lowerName.includes('clauses_administratives')) return 'ccap';
  if (lowerName.includes('cctp') || lowerName.includes('clauses_techniques')) return 'cctp';
  if (lowerName.includes('note') || lowerName.includes('programme')) return 'note_programme';
  if (lowerName.includes('audit') || lowerName.includes('diagnostic')) return 'audit_technique';
  if (lowerName.includes('dpgf') || lowerName.includes('bpu') || lowerName.includes('dqe')) return 'dpgf';
  if (lowerName.includes('plan') || lowerName.match(/\.(dwg|dxf)$/)) return 'plan';
  
  return 'autre';
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

export function TenderDocumentsTab({ tender, onNavigateToTab }: TenderDocumentsTabProps) {
  const { 
    documents, 
    isLoading, 
    uploadDocument, 
    deleteDocument, 
    analyzeDocument, 
    reanalyzeAllDocuments 
  } = useTenderDocuments(tender.id);
  const { updateTender } = useTenders();
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupedDocs = groupDocumentsByType(documents);
  const analyzedDocs = documents.filter(d => d.is_analyzed);
  const notAnalyzedDocs = documents.filter(d => !d.is_analyzed);
  const hasDocuments = documents.length > 0;
  const hasAnalyzedDocs = analyzedDocs.length > 0;
  const allAnalyzed = hasDocuments && notAnalyzedDocs.length === 0;

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

  // Run analysis on documents
  const runAnalysis = async (docsToAnalyze: typeof notAnalyzedDocs) => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    try {
      for (let i = 0; i < docsToAnalyze.length; i++) {
        setAnalysisStep(i + 1);
        await analyzeDocument.mutateAsync(docsToAnalyze[i].id);
      }
      toast.success("Analyse terminée");
      setShowAnalysisPanel(true);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Merge all extracted data and normalize nested structures
  const mergedExtractedData = analyzedDocs.reduce((acc, doc) => {
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      const data = doc.extracted_data as Record<string, unknown>;
      
      // Normalize site_visit object to flat fields
      if (data.site_visit && typeof data.site_visit === 'object') {
        const siteVisit = data.site_visit as Record<string, unknown>;
        if (siteVisit.required !== undefined) data.site_visit_required = siteVisit.required;
        if (siteVisit.date) {
          let dateStr = siteVisit.date as string;
          if (siteVisit.time) {
            dateStr = `${dateStr}T${siteVisit.time}`;
          }
          data.site_visit_date = dateStr;
        }
        if (siteVisit.location) data.site_visit_location = siteVisit.location;
        if (siteVisit.contact_name) data.site_visit_contact_name = siteVisit.contact_name;
        if (siteVisit.contact_email) data.site_visit_contact_email = siteVisit.contact_email;
        if (siteVisit.contact_phone) data.site_visit_contact_phone = siteVisit.contact_phone;
      }
      
      // Normalize deadlines object
      if (data.deadlines && typeof data.deadlines === 'object') {
        const deadlines = data.deadlines as Record<string, unknown>;
        if (deadlines.submission) {
          let dateStr = deadlines.submission as string;
          if (deadlines.submission_time) {
            dateStr = `${dateStr}T${deadlines.submission_time}`;
          }
          data.submission_deadline = dateStr;
        }
        if (deadlines.jury) data.jury_date = deadlines.jury;
        if (deadlines.results) data.results_date = deadlines.results;
      }
      
      // Normalize client object
      if (data.client && typeof data.client === 'object') {
        const client = data.client as Record<string, unknown>;
        if (client.name) data.client_name = client.name;
        if (client.type) data.client_type = client.type;
        if (client.contact_name) data.client_contact_name = client.contact_name;
        if (client.contact_email) data.client_contact_email = client.contact_email;
      }
      
      // Normalize project object
      if (data.project && typeof data.project === 'object') {
        const project = data.project as Record<string, unknown>;
        if (project.location) data.location = project.location;
        if (project.surface) data.surface_area = project.surface;
        if (project.description) data.description = project.description;
        if (project.region) data.region = project.region;
      }
      
      // Normalize budget object
      if (data.budget && typeof data.budget === 'object') {
        const budget = data.budget as Record<string, unknown>;
        if (budget.amount) data.estimated_budget = budget.amount;
        if (budget.disclosed !== undefined) data.budget_disclosed = budget.disclosed;
      }
      
      // Normalize consultation object
      if (data.consultation && typeof data.consultation === 'object') {
        const consultation = data.consultation as Record<string, unknown>;
        if (consultation.number) data.consultation_number = consultation.number;
        if (consultation.reference) data.reference = consultation.reference;
        if (consultation.object) data.market_object = consultation.object;
      }
      
      // Normalize procedure object
      if (data.procedure && typeof data.procedure === 'object') {
        const procedure = data.procedure as Record<string, unknown>;
        if (procedure.type) data.procedure_type = procedure.type;
        if (procedure.allows_variants !== undefined) data.allows_variants = procedure.allows_variants;
        if (procedure.allows_joint_venture !== undefined) data.allows_joint_venture = procedure.allows_joint_venture;
        if (procedure.joint_venture_type) data.joint_venture_type = procedure.joint_venture_type;
        if (procedure.offer_validity_days) data.offer_validity_days = procedure.offer_validity_days;
      }
      
      return { ...acc, ...data };
    }
    return acc;
  }, {} as Record<string, unknown>);

  // Extract critical alerts from analyzed documents
  const extractedAlerts = analyzedDocs.reduce((acc, doc) => {
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      const data = doc.extracted_data as Record<string, unknown>;
      if (data.critical_alerts && Array.isArray(data.critical_alerts)) {
        return [...acc, ...data.critical_alerts];
      }
      if (data.points_vigilance && Array.isArray(data.points_vigilance)) {
        return [...acc, ...data.points_vigilance.map((p: any) => ({
          type: 'vigilance',
          message: typeof p === 'string' ? p : p.message || p.description,
          severity: 'warning',
          source: doc.file_name
        }))];
      }
    }
    return acc;
  }, [] as Array<{ type: string; message: string; severity: string; source?: string }>);

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
    
    // Map extracted fields to tender
    if (mergedExtractedData.client_name && !tender.client_name) {
      updates.client_name = mergedExtractedData.client_name as string;
    }
    if (mergedExtractedData.client_type && !tender.client_type) {
      (updates as any).client_type = mergedExtractedData.client_type as string;
    }
    if (mergedExtractedData.location && !tender.location) {
      updates.location = mergedExtractedData.location as string;
    }
    if (mergedExtractedData.region && !tender.region) {
      (updates as any).region = mergedExtractedData.region as string;
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
    
    // Handle required_team/competencies
    if (mergedExtractedData.required_competencies && Array.isArray(mergedExtractedData.required_competencies)) {
      const team = (mergedExtractedData.required_competencies as any[]).map(comp => ({
        specialty: comp.specialty,
        is_mandatory: comp.mandatory !== false,
        notes: comp.requirements || comp.notes,
      }));
      if (team.length > 0 && (!tender.required_team || (Array.isArray(tender.required_team) && tender.required_team.length === 0))) {
        (updates as any).required_team = team;
      }
    }

    // Save extracted alerts to the tender
    if (extractedAlerts.length > 0) {
      const existingAlerts = (tender.critical_alerts as any[]) || [];
      const newAlerts = extractedAlerts.filter(
        (newAlert) => !existingAlerts.some((existing: any) => existing.message === newAlert.message)
      );
      if (newAlerts.length > 0) {
        (updates as any).critical_alerts = [...existingAlerts, ...newAlerts];
      }
    }

    if (Object.keys(updates).length > 0) {
      updateTender.mutate({ id: tender.id, ...updates } as any);
      toast.success(`${Object.keys(updates).length} champ(s) appliqué(s) à la synthèse`);
      onNavigateToTab('synthese');
    } else {
      toast.info("Aucune nouvelle donnée à appliquer");
    }
  };

  // Extracted items for display
  const extractedItems = [
    { key: 'client_name', label: 'Maître d\'ouvrage', found: !!mergedExtractedData.client_name },
    { key: 'procedure_type', label: 'Type de procédure', found: !!mergedExtractedData.procedure_type },
    { key: 'location', label: 'Localisation', found: !!mergedExtractedData.location },
    { key: 'budget', label: 'Budget', found: !!(mergedExtractedData.estimated_budget || mergedExtractedData.budget) },
    { key: 'deadline', label: 'Date limite de remise', found: !!mergedExtractedData.submission_deadline },
    { key: 'site_visit_required', label: 'Visite de site', found: mergedExtractedData.site_visit_required !== undefined },
    { key: 'site_visit_date', label: 'Date de visite', found: !!mergedExtractedData.site_visit_date },
    { key: 'criteria', label: 'Critères de jugement', found: !!(mergedExtractedData.criteria || mergedExtractedData.judgment_criteria) },
    { key: 'team', label: 'Compétences requises', found: !!(mergedExtractedData.required_competencies || mergedExtractedData.required_team) },
    { key: 'surface', label: 'Surface', found: !!mergedExtractedData.surface_area },
  ];

  const extractedCount = extractedItems.filter(i => i.found).length;
  const extractionProgress = hasAnalyzedDocs ? Math.round((extractedCount / extractedItems.length) * 100) : 0;

  // Ask AI a question about the documents
  const handleAskAI = async () => {
    if (!question.trim() || isAskingAI) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setIsAskingAI(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ask-dce-question', {
        body: {
          tenderId: tender.id,
          question: userMessage.content,
          documentIds: documents.map(d => d.id),
        }
      });

      if (error) throw error;
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: data?.answer || "Je n'ai pas pu trouver de réponse dans les documents.",
        sources: data?.sources,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking AI:', error);
      toast.error("Erreur lors de l'analyse");
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAskingAI(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Documents DCE</h2>
            <p className="text-sm text-muted-foreground">
              {documents.length} document{documents.length > 1 ? 's' : ''} • {analyzedDocs.length} analysé{analyzedDocs.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDocuments && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Download all documents
                documents.forEach((doc: any) => {
                  if (doc.file_url) {
                    const link = document.createElement('a');
                    link.href = doc.file_url;
                    link.download = doc.file_name;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                });
                toast.success(`Téléchargement de ${documents.length} document(s)`);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Tout télécharger
            </Button>
          )}
          {hasDocuments && !allAnalyzed && (
            <Button
              onClick={() => runAnalysis(notAnalyzedDocs)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse {analysisStep}/{notAnalyzedDocs.length}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser ({notAnalyzedDocs.length})
                </>
              )}
            </Button>
          )}
          {allAnalyzed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAnalysis(documents)}
              disabled={isAnalyzing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réanalyser
            </Button>
          )}
          <Button
            variant={showChat ? "default" : "outline"}
            size="sm"
            onClick={() => setShowChat(!showChat)}
            disabled={documents.length === 0}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Question au DCE
          </Button>
        </div>
      </div>

      {/* Analysis Results Panel */}
      {hasAnalyzedDocs && (
        <Collapsible open={showAnalysisPanel} onOpenChange={setShowAnalysisPanel}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Données extraites par l'IA</CardTitle>
                      <CardDescription>
                        {extractedCount}/{extractedItems.length} informations trouvées
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={extractionProgress} className="w-24 h-2" />
                    <Badge variant={allAnalyzed ? "default" : "secondary"}>
                      {allAnalyzed ? "Complet" : "Partiel"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* Extracted items grid */}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {extractedItems.map(item => (
                    <div 
                      key={item.key}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border text-sm",
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
                      <span className={cn(!item.found && "text-muted-foreground")}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Apply button */}
                <Button 
                  onClick={handleApplyExtractedData}
                  className="w-full"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Appliquer à la synthèse
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-primary/20">
              <CardHeader className="py-3 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Question au DCE
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Area */}
                <div ref={scrollRef} className="h-64 overflow-auto p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && !isAskingAI && (
                      <div className="text-center py-8">
                        <FileSearch className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Posez une question sur le DCE
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                          {[
                            "Quelles sont les pénalités de retard ?",
                            "Y a-t-il une visite obligatoire ?",
                          ].map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => setQuestion(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.type === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.type === "assistant" && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-xl p-3",
                            message.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="flex flex-wrap gap-1">
                                {message.sources.map((source, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isAskingAI && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        </div>
                        <div className="bg-muted rounded-xl p-3">
                          <p className="text-sm text-muted-foreground">Recherche dans les documents...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Input Area */}
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Posez votre question..."
                      className="min-h-[44px] max-h-[100px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAskAI();
                        }
                      }}
                      disabled={isAskingAI || documents.length === 0}
                    />
                    <Button
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={handleAskAI}
                      disabled={!question.trim() || isAskingAI || documents.length === 0}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('doc-upload')?.click()}
          >
            <input
              type="file"
              id="doc-upload"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.zip"
              onChange={handleFileSelect}
            />
            {uploadDocument.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Glissez-déposez vos fichiers ici</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Excel, Plans • Le type sera auto-détecté
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter by type */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les documents</SelectItem>
              {TYPE_ORDER.filter(type => groupedDocs[type]).map(type => (
                <SelectItem key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type] || type} ({groupedDocs[type].length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Documents by Type */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun document téléchargé</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par ajouter les documents du DCE
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {TYPE_ORDER.filter(type => selectedDocType === 'all' ? groupedDocs[type] : type === selectedDocType).map(type => (
            groupedDocs[type] && (
              <Card key={type}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{DOCUMENT_TYPE_LABELS[type] || type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {groupedDocs[type].length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {groupedDocs[type].map((doc: any) => (
                      <div 
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        {getFileIcon(doc.file_name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                        {doc.is_analyzed && (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Analysé
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          {doc.file_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                              >
                                <a href={doc.file_url} download={doc.file_name}>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteDocument.mutate(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}
    </div>
  );
}
