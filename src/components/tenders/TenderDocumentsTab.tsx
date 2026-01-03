import { useState, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Loader2,
  File,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  FileType,
  FileImage,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { DOCUMENT_TYPE_LABELS } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface TenderDocumentsTabProps {
  tenderId: string;
}

// Auto-detect document type from filename
function detectDocumentType(filename: string): string {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('rc') || lowerName.includes('reglement') || lowerName.includes('consultation')) {
    return 'rc';
  }
  if (lowerName.includes('ccap') || lowerName.includes('clauses_administratives')) {
    return 'ccap';
  }
  if (lowerName.includes('cctp') || lowerName.includes('clauses_techniques')) {
    return 'cctp';
  }
  if (lowerName.includes('acte') && lowerName.includes('engagement') || lowerName.includes('_ae')) {
    return 'ae';
  }
  if (lowerName.includes('dc1')) {
    return 'dc1';
  }
  if (lowerName.includes('dc2')) {
    return 'dc2';
  }
  if (lowerName.includes('dc4')) {
    return 'dc4';
  }
  if (lowerName.includes('lettre') && lowerName.includes('consultation')) {
    return 'lettre_consultation';
  }
  if (lowerName.includes('note') || lowerName.includes('programme')) {
    return 'note_programme';
  }
  if (lowerName.includes('attestation') && lowerName.includes('visite')) {
    return 'attestation_visite';
  }
  if (lowerName.includes('audit') || lowerName.includes('diagnostic')) {
    return 'audit_technique';
  }
  if (lowerName.includes('dpgf') || lowerName.includes('bpu') || lowerName.includes('dqe')) {
    return 'dpgf';
  }
  if (lowerName.includes('plan') || lowerName.match(/\.(dwg|dxf)$/)) {
    return 'plan';
  }
  if (lowerName.includes('contrat')) {
    return 'contrat';
  }
  if (lowerName.includes('annexe')) {
    return 'annexe';
  }
  
  return 'autre';
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileType className="h-5 w-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <FileImage className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
}

export function TenderDocumentsTab({ tenderId }: TenderDocumentsTabProps) {
  const { documents, isLoading, uploadDocument, deleteDocument, analyzeDocument } = useTenderDocuments(tenderId);
  const [uploadType, setUploadType] = useState<string>("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const docType = uploadType === 'auto' ? detectDocumentType(file.name) : uploadType;
      uploadDocument.mutate({ file, documentType: docType });
    });
  }, [uploadType, uploadDocument]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const docType = uploadType === 'auto' ? detectDocumentType(file.name) : uploadType;
        uploadDocument.mutate({ file, documentType: docType });
      });
    }
    e.target.value = '';
  };

  const handleAnalyze = async (docId: string) => {
    setAnalyzingIds(prev => [...prev, docId]);
    try {
      await analyzeDocument.mutateAsync(docId);
    } finally {
      setAnalyzingIds(prev => prev.filter(id => id !== docId));
    }
  };

  const handleAnalyzeAll = async () => {
    const toAnalyze = documents.filter(d => !d.is_analyzed);
    for (const doc of toAnalyze) {
      await handleAnalyze(doc.id);
    }
  };

  const analyzedCount = documents.filter(d => d.is_analyzed).length;

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    const type = doc.document_type || 'autre';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Documents du DCE</span>
            <Badge variant="secondary">
              {documents.length} document{documents.length > 1 ? 's' : ''}
              {analyzedCount > 0 && ` • ${analyzedCount} analysé${analyzedCount > 1 ? 's' : ''}`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Auto-détection
                  </span>
                </SelectItem>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {uploadType === 'auto' 
                ? "Le type sera détecté automatiquement" 
                : "Type sélectionné manuellement"
              }
            </span>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border",
              uploadDocument.isPending && "opacity-50 pointer-events-none"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                {uploadDocument.isPending ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">
                  {isDragging ? "Déposez les fichiers ici" : "Glissez-déposez vos documents"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, Excel, Images • Max 10 Mo par fichier
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Documents uploadés</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzeAll}
                disabled={analyzingIds.length > 0 || documents.every(d => d.is_analyzed)}
              >
                {analyzingIds.length > 0 ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Analyser tous avec IA
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(documentsByType).map(([type, docs]) => (
                <div key={type}>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    {DOCUMENT_TYPE_LABELS[type] || type}
                  </h4>
                  <div className="divide-y border rounded-lg">
                    {docs.map((doc) => (
                      <div key={doc.id} className="p-3 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.file_name)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            {doc.is_analyzed ? (
                              <Badge variant="secondary" className="text-xs shrink-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Analysé
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Non analysé
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} Ko` : ''} 
                            {doc.uploaded_at && ` • ${format(new Date(doc.uploaded_at), "dd MMM yyyy HH:mm", { locale: fr })}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {doc.is_analyzed && doc.extracted_data && Object.keys(doc.extracted_data).length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewDoc(doc)}
                              title="Voir les données extraites"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {!doc.is_analyzed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAnalyze(doc.id)}
                              disabled={analyzingIds.includes(doc.id)}
                            >
                              {analyzingIds.includes(doc.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  Analyser
                                </>
                              )}
                            </Button>
                          )}
                          <a 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-muted rounded"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteDocument.mutate(doc.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Viewer */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewDoc && getFileIcon(viewDoc.file_name)}
              Données extraites - {viewDoc?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewDoc?.extracted_data && (
              <ExtractedDataDisplay data={viewDoc.extracted_data} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExtractedDataDisplay({ data }: { data: Record<string, unknown> }) {
  const renderValue = (value: unknown, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Oui</Badge>
      ) : (
        <Badge variant="secondary">Non</Badge>
      );
    }
    
    if (typeof value === 'number') {
      return <span className="font-mono">{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      return <span>{value}</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground">Aucun</span>;
      
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <div key={index} className="pl-2 border-l-2 border-border">
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      return (
        <div className="space-y-2 pl-2">
          {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="text-xs text-muted-foreground capitalize min-w-[100px]">
                {key.replace(/_/g, ' ')}:
              </span>
              <div className="flex-1">{renderValue(val, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    
    return String(value);
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2 capitalize">{key.replace(/_/g, ' ')}</h4>
          <div className="text-sm">{renderValue(value)}</div>
        </div>
      ))}
    </div>
  );
}
