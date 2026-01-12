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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function TenderDocumentsTab({ tenderId }: TenderDocumentsTabProps) {
  const { 
    documents, 
    isLoading, 
    uploadDocument, 
    deleteDocument, 
    analyzeDocument, 
    reanalyzeAllDocuments 
  } = useTenderDocuments(tenderId);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("all");
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupedDocs = groupDocumentsByType(documents);
  const analyzedCount = documents.filter(d => d.is_analyzed).length;

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

  // Reanalyze all documents with the full DCE analysis
  const handleReanalyze = async () => {
    if (documents.length === 0) return;
    reanalyzeAllDocuments.mutate();
  };

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
      const { data, error } = await supabase.functions.invoke('analyze-tender-documents', {
        body: {
          tenderId,
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
              {documents.length} document{documents.length > 1 ? 's' : ''} • {analyzedCount} analysé{analyzedCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={documents.length === 0 || reanalyzeAllDocuments.isPending}
            title="Relancer l'analyse DCE complète pour mettre à jour les informations extraites"
          >
            {reanalyzeAllDocuments.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Relancer l'analyse
          </Button>
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
    </div>
  );
}