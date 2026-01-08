import { useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  MessageCircle,
  Loader2,
  Search,
  Sparkles,
  Send,
  CheckCircle2,
  FolderOpen,
  File,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { DOCUMENT_TYPE_LABELS } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenderDocumentsTabProps {
  tenderId: string;
  onSuggestFill?: (data: any) => void;
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

export function TenderDocumentsTab({ tenderId, onSuggestFill }: TenderDocumentsTabProps) {
  const { documents, isLoading, uploadDocument, deleteDocument, analyzeDocument } = useTenderDocuments(tenderId);
  const [isDragging, setIsDragging] = useState(false);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [showFillDialog, setShowFillDialog] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("all");

  const groupedDocs = groupDocumentsByType(documents);
  
  // Filter documents by selected type
  const filteredDocs = selectedDocType === 'all' 
    ? documents 
    : documents.filter(d => d.document_type === selectedDocType);

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

  // Ask AI a question about the documents
  const handleAskAI = async () => {
    if (!question.trim()) return;
    
    setIsAskingAI(true);
    setAiAnswer("");
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-tender-documents', {
        body: {
          tenderId,
          question,
          documentIds: documents.map(d => d.id),
        }
      });

      if (error) throw error;
      
      setAiAnswer(data?.answer || "Je n'ai pas pu trouver de réponse dans les documents.");
    } catch (error) {
      console.error('Error asking AI:', error);
      toast.error("Erreur lors de la requête IA");
    } finally {
      setIsAskingAI(false);
    }
  };

  // Analyze all documents and suggest filling tender fields
  const handleAnalyzeAndFill = async () => {
    if (documents.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // First, analyze documents that haven't been analyzed yet
      const rcDoc = documents.find(d => d.document_type === 'rc');
      const docsToAnalyze = rcDoc ? [rcDoc] : documents.slice(0, 3);
      
      const results: any[] = [];
      
      for (const doc of docsToAnalyze) {
        if (!doc.is_analyzed) {
          const { data, error } = await supabase.functions.invoke('analyze-tender-documents', {
            body: { 
              documentUrl: doc.file_url,
              documentType: doc.document_type,
              tenderId,
              fileName: doc.file_name,
            }
          });
          
          if (!error && data?.extractedData) {
            results.push(data.extractedData);
            
            // Mark as analyzed
            await supabase
              .from("tender_documents")
              .update({
                is_analyzed: true,
                analyzed_at: new Date().toISOString(),
                extracted_data: data.extractedData,
              })
              .eq("id", doc.id);
          }
        } else if (doc.extracted_data) {
          results.push(doc.extracted_data);
        }
      }
      
      // Merge all extracted data
      const mergedData = results.reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});
      
      setAnalysisResult(mergedData);
      setShowFillDialog(true);
      toast.success("Analyse terminée !");
    } catch (error) {
      console.error('Error analyzing documents:', error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply suggestions to tender
  const handleApplySuggestions = async () => {
    if (!analysisResult) return;
    
    try {
      // Map extracted data to tender fields
      const updates: any = {};
      
      if (analysisResult.consultation?.object) {
        updates.title = analysisResult.consultation.object;
      }
      if (analysisResult.consultation?.number) {
        updates.reference = analysisResult.consultation.number;
      }
      if (analysisResult.client?.name) {
        updates.client_name = analysisResult.client.name;
      }
      if (analysisResult.project?.location) {
        updates.location = analysisResult.project.location;
      }
      if (analysisResult.project?.surface) {
        updates.surface_m2 = analysisResult.project.surface;
      }
      if (analysisResult.budget?.amount) {
        updates.estimated_budget = analysisResult.budget.amount;
      }
      if (analysisResult.procedure?.type) {
        updates.procedure_type = analysisResult.procedure.type;
      }
      if (analysisResult.deadlines?.submission) {
        updates.submission_deadline = analysisResult.deadlines.submission;
      }
      if (analysisResult.site_visit?.date) {
        updates.site_visit_date = analysisResult.site_visit.date;
      }
      if (analysisResult.site_visit?.required !== undefined) {
        updates.site_visit_required = analysisResult.site_visit.required;
      }
      if (analysisResult.selection_criteria) {
        updates.selection_criteria = analysisResult.selection_criteria;
      }
      if (analysisResult.required_competencies) {
        updates.required_team = analysisResult.required_competencies;
      }
      if (analysisResult.required_documents) {
        updates.required_documents = analysisResult.required_documents;
      }
      if (analysisResult.moe_phases) {
        updates.moe_phases = analysisResult.moe_phases;
      }
      
      // Add notes with all extracted info
      const notes = [];
      if (analysisResult.client?.contact_name) {
        notes.push(`Contact MOA: ${analysisResult.client.contact_name}`);
      }
      if (analysisResult.client?.contact_email) {
        notes.push(`Email: ${analysisResult.client.contact_email}`);
      }
      if (analysisResult.client?.contact_phone) {
        notes.push(`Tel: ${analysisResult.client.contact_phone}`);
      }
      if (analysisResult.site_visit?.location) {
        notes.push(`RDV visite: ${analysisResult.site_visit.location}`);
      }
      if (analysisResult.site_visit?.contact_name) {
        notes.push(`Contact visite: ${analysisResult.site_visit.contact_name} ${analysisResult.site_visit.contact_phone || ''}`);
      }
      if (analysisResult.procedure?.offer_validity_days) {
        notes.push(`Validité offres: ${analysisResult.procedure.offer_validity_days} jours`);
      }
      
      if (notes.length > 0) {
        updates.notes = notes.join('\n');
      }
      
      // Update the tender
      const { error } = await supabase
        .from("tenders")
        .update(updates)
        .eq("id", tenderId);
      
      if (error) throw error;
      
      toast.success("Appel d'offre mis à jour avec les données du DCE");
      setShowFillDialog(false);
      
      // Notify parent if callback provided
      if (onSuggestFill) {
        onSuggestFill(updates);
      }
      
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error('Error applying suggestions:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents du DCE</CardTitle>
            <Badge variant="secondary">{documents.length} fichier{documents.length > 1 ? 's' : ''}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4",
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
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez vos fichiers ici
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Le type sera auto-détecté (RC, CCTP, CCAP, Programme, Plans...)
                </p>
              </>
            )}
          </div>

          {/* Filter by type */}
          {documents.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
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
              
              <Button
                variant="outline"
                onClick={() => setShowQuestionDialog(true)}
                disabled={documents.length === 0}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Question au DCE
              </Button>
              
              <Button
                onClick={handleAnalyzeAndFill}
                disabled={documents.length === 0 || isAnalyzing}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Pré-remplir le concours
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} Ko` : 'Taille inconnue'}
                          </p>
                        </div>
                        {doc.is_analyzed && (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Analysé
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={doc.file_url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
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

      {/* Question to DCE Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Poser une question au DCE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Quelles sont les pièces à fournir pour la candidature ? Quel est le délai de validité des offres ?"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                L'IA cherchera la réponse uniquement dans les documents téléchargés.
              </p>
            </div>
            
            {aiAnswer && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm whitespace-pre-wrap">{aiAnswer}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowQuestionDialog(false);
              setQuestion("");
              setAiAnswer("");
            }}>
              Fermer
            </Button>
            <Button 
              onClick={handleAskAI}
              disabled={isAskingAI || !question.trim()}
            >
              {isAskingAI ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill suggestions Dialog */}
      <Dialog open={showFillDialog} onOpenChange={setShowFillDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Données extraites du DCE
            </DialogTitle>
            <DialogDescription>
              L'IA a analysé les documents et propose de pré-remplir les champs suivants.
            </DialogDescription>
          </DialogHeader>
          
          {analysisResult && (
            <div className="space-y-4 py-4">
              {/* Consultation info */}
              {analysisResult.consultation && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Identification</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    {analysisResult.consultation.object && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Objet:</span> {analysisResult.consultation.object}
                      </div>
                    )}
                    {analysisResult.consultation.number && (
                      <div>
                        <span className="text-muted-foreground">N° consultation:</span> {analysisResult.consultation.number}
                      </div>
                    )}
                    {analysisResult.consultation.reference && (
                      <div>
                        <span className="text-muted-foreground">Référence:</span> {analysisResult.consultation.reference}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Client info */}
              {analysisResult.client && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Maître d'ouvrage</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    {analysisResult.client.name && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Nom:</span> {analysisResult.client.name}
                      </div>
                    )}
                    {analysisResult.client.contact_name && (
                      <div>
                        <span className="text-muted-foreground">Contact:</span> {analysisResult.client.contact_name}
                      </div>
                    )}
                    {analysisResult.client.contact_email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span> {analysisResult.client.contact_email}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Project info */}
              {analysisResult.project && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Projet</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    {analysisResult.project.location && (
                      <div>
                        <span className="text-muted-foreground">Localisation:</span> {analysisResult.project.location}
                      </div>
                    )}
                    {analysisResult.project.surface && (
                      <div>
                        <span className="text-muted-foreground">Surface:</span> {analysisResult.project.surface} m²
                      </div>
                    )}
                    {analysisResult.project.description && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Description:</span> {analysisResult.project.description}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Budget */}
              {analysisResult.budget?.amount && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Budget</Badge>
                  </h4>
                  <div className="text-sm bg-muted/50 p-3 rounded-lg">
                    <span className="text-muted-foreground">Montant estimé:</span> {(analysisResult.budget.amount / 1000000).toFixed(2)} M€ HT
                  </div>
                </div>
              )}
              
              {/* Deadlines */}
              {analysisResult.deadlines && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Dates clés</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    {analysisResult.deadlines.submission && (
                      <div>
                        <span className="text-muted-foreground">Date limite:</span> {analysisResult.deadlines.submission}
                        {analysisResult.deadlines.submission_time && ` à ${analysisResult.deadlines.submission_time}`}
                      </div>
                    )}
                    {analysisResult.deadlines.jury && (
                      <div>
                        <span className="text-muted-foreground">Jury:</span> {analysisResult.deadlines.jury}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Site visit */}
              {analysisResult.site_visit && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Visite de site</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    {analysisResult.site_visit.required !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Obligatoire:</span> {analysisResult.site_visit.required ? 'Oui' : 'Non'}
                      </div>
                    )}
                    {analysisResult.site_visit.date && (
                      <div>
                        <span className="text-muted-foreground">Date:</span> {analysisResult.site_visit.date}
                      </div>
                    )}
                    {analysisResult.site_visit.location && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Lieu RDV:</span> {analysisResult.site_visit.location}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selection criteria */}
              {analysisResult.selection_criteria?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Critères de jugement</Badge>
                  </h4>
                  <div className="space-y-1 text-sm bg-muted/50 p-3 rounded-lg">
                    {analysisResult.selection_criteria.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{c.name}</span>
                        <span className="font-medium">{c.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Required competencies */}
              {analysisResult.required_competencies?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Badge variant="outline">Compétences requises</Badge>
                  </h4>
                  <div className="flex flex-wrap gap-2 bg-muted/50 p-3 rounded-lg">
                    {analysisResult.required_competencies.map((c: any, i: number) => (
                      <Badge key={i} variant={c.mandatory ? "default" : "secondary"}>
                        {c.specialty}
                        {c.mandatory && " *"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFillDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleApplySuggestions}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Appliquer ces données
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
