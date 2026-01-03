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

export function TenderDocumentsTab({ tenderId }: TenderDocumentsTabProps) {
  const { documents, isLoading, uploadDocument, deleteDocument, analyzeDocument } = useTenderDocuments(tenderId);
  const [uploadType, setUploadType] = useState<string>("rc");
  const [isDragging, setIsDragging] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      uploadDocument.mutate({ file, documentType: uploadType });
    });
  }, [uploadType, uploadDocument]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        uploadDocument.mutate({ file, documentType: uploadType });
      });
    }
    e.target.value = '';
  };

  const analyzedCount = documents.filter(d => d.is_analyzed).length;

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
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Sélectionnez le type avant d'uploader
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
              accept=".pdf,.doc,.docx"
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
                  ou cliquez pour sélectionner (PDF, DOC, DOCX)
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
                onClick={() => {
                  documents
                    .filter(d => !d.is_analyzed)
                    .forEach(d => analyzeDocument.mutate(d.id));
                }}
                disabled={analyzeDocument.isPending || documents.every(d => d.is_analyzed)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analyser tous avec IA
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </Badge>
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {!doc.is_analyzed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => analyzeDocument.mutate(doc.id)}
                        disabled={analyzeDocument.isPending}
                      >
                        {analyzeDocument.isPending ? (
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
                    >
                      <File className="h-4 w-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
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
      )}

      {/* Extracted Data Viewer */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Données extraites - {viewDoc?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewDoc?.extracted_data && (
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[60vh]">
                {JSON.stringify(viewDoc.extracted_data, null, 2)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
