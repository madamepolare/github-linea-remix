import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  Calendar,
  MapPin,
  Euro,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Eye,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { useTenders } from "@/hooks/useTenders";
import { 
  TENDER_STATUS_LABELS, 
  TENDER_STATUS_COLORS, 
  type Tender,
  type TenderStatus,
} from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Tenders() {
  const navigate = useNavigate();
  const { tenders, tendersByStatus, stats, isLoading, createTender, deleteTender } = useTenders();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);

  const filteredTenders = tenders.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Analyze files with AI before creation
  const handleAnalyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Déposez au moins un fichier DCE");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setExtractedInfo(null);

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
        setExtractedInfo(data.extractedData);
        setAnalysisComplete(true);
        toast.success("Analyse terminée !");
      } else {
        throw new Error("Aucune donnée extraite");
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Erreur lors de l'analyse IA");
      // Still allow creation with default values
      setExtractedInfo({ title: "Nouveau concours" });
      setAnalysisComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Create tender with extracted info
  const handleCreateTender = async () => {
    if (!extractedInfo) return;

    try {
      const reference = extractedInfo.reference || `AO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      const result = await createTender.mutateAsync({
        reference,
        title: extractedInfo.title || "Nouveau concours",
        status: 'en_analyse',
        client_name: extractedInfo.client_name,
        client_type: extractedInfo.client_type,
        location: extractedInfo.location,
        estimated_budget: extractedInfo.estimated_budget,
        procedure_type: extractedInfo.procedure_type,
        submission_deadline: extractedInfo.submission_deadline,
        site_visit_date: extractedInfo.site_visit_date,
        site_visit_required: extractedInfo.site_visit_required,
        description: extractedInfo.project_description,
        surface_area: extractedInfo.surface_area,
      });

      // Store files for upload on detail page
      const fileData = await Promise.all(uploadedFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await file.arrayBuffer().then(buf => 
          btoa(String.fromCharCode(...new Uint8Array(buf)))
        ),
      })));
      sessionStorage.setItem(`tender-files-${result.id}`, JSON.stringify(fileData));
      
      // Reset and navigate
      setShowCreateDialog(false);
      setUploadedFiles([]);
      setExtractedInfo(null);
      setAnalysisComplete(false);
      navigate(`/tenders/${result.id}?autoUpload=true`);
      toast.success("Concours créé avec les informations extraites");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  // Reset dialog state
  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setUploadedFiles([]);
    setExtractedInfo(null);
    setAnalysisComplete(false);
    setIsAnalyzing(false);
  };

  const kanbanColumns: TenderStatus[] = ['repere', 'en_analyse', 'go', 'en_montage', 'depose'];

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Concours"
          description="Gérez vos appels d'offres et marchés publics"
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <div className="flex items-center border rounded-lg p-0.5">
                <Button
                  variant={viewMode === "kanban" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className="h-7 px-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-7 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          }
          primaryAction={{
            label: "Nouveau concours",
            onClick: () => setShowCreateDialog(true),
          }}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 border-b">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.enAnalyse}</p>
            <p className="text-xs text-muted-foreground">En analyse</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.enMontage}</p>
            <p className="text-xs text-muted-foreground">En montage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.deposes}</p>
            <p className="text-xs text-muted-foreground">Déposés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.tauxReussite}%</p>
            <p className="text-xs text-muted-foreground">Taux de réussite</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : viewMode === "kanban" ? (
            <div className="flex gap-4 h-full overflow-x-auto pb-4">
              {kanbanColumns.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tenders={tendersByStatus[status] || []}
                  onTenderClick={(id) => navigate(`/tenders/${id}`)}
                  onDelete={(id) => deleteTender.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <TenderListView 
              tenders={filteredTenders} 
              onTenderClick={(id) => navigate(`/tenders/${id}`)}
              onDelete={(id) => deleteTender.mutate(id)}
            />
          )}
        </div>
      </div>

      {/* Create Dialog - Analyze before creation */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nouveau concours
            </DialogTitle>
            <DialogDescription>
              {!analysisComplete 
                ? "Déposez vos documents DCE et l'IA analysera automatiquement toutes les informations"
                : "Vérifiez les informations extraites avant de créer le concours"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {!analysisComplete ? (
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
                            ×
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
              /* Extracted Info Preview */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700">
                    Analyse terminée - Informations extraites
                  </p>
                </div>

                <div className="grid gap-3">
                  {extractedInfo?.title && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Titre</p>
                      <p className="font-medium">{extractedInfo.title}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {extractedInfo?.reference && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Référence</p>
                        <p className="font-medium">{extractedInfo.reference}</p>
                      </div>
                    )}
                    {extractedInfo?.client_name && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Maître d'ouvrage</p>
                        <p className="font-medium">{extractedInfo.client_name}</p>
                      </div>
                    )}
                    {extractedInfo?.location && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Lieu</p>
                        <p className="font-medium">{extractedInfo.location}</p>
                      </div>
                    )}
                    {extractedInfo?.estimated_budget && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Budget estimé</p>
                        <p className="font-medium">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(extractedInfo.estimated_budget)}
                        </p>
                      </div>
                    )}
                    {extractedInfo?.submission_deadline && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Date limite</p>
                        <p className="font-medium">
                          {format(new Date(extractedInfo.submission_deadline), "d MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    )}
                    {extractedInfo?.procedure_type && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Procédure</p>
                        <p className="font-medium capitalize">{extractedInfo.procedure_type}</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Vous pourrez compléter ces informations après la création
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            {!analysisComplete ? (
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
            ) : (
              <Button 
                onClick={handleCreateTender}
                disabled={createTender.isPending}
                className="gap-2"
              >
                {createTender.isPending ? (
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function KanbanColumn({ 
  status, 
  tenders, 
  onTenderClick,
  onDelete,
}: { 
  status: TenderStatus; 
  tenders: Tender[];
  onTenderClick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", TENDER_STATUS_COLORS[status])}>
            {TENDER_STATUS_LABELS[status]}
          </Badge>
          <span className="text-xs text-muted-foreground">{tenders.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tenders.map((tender) => (
          <TenderCard 
            key={tender.id} 
            tender={tender} 
            onClick={() => onTenderClick(tender.id)}
            onDelete={() => onDelete(tender.id)}
          />
        ))}
        {tenders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucun concours
          </div>
        )}
      </div>
    </div>
  );
}

function TenderCard({ 
  tender, 
  onClick,
  onDelete,
}: { 
  tender: Tender; 
  onClick: () => void;
  onDelete: () => void;
}) {
  const deadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
  const isUrgent = deadline && differenceInDays(deadline, new Date()) <= 7 && !isPast(deadline);
  const isOverdue = deadline && isPast(deadline);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-mono">{tender.reference}</p>
            <p className="font-medium text-sm line-clamp-2">{tender.title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {tender.client_name && (
          <p className="text-xs text-muted-foreground truncate">{tender.client_name}</p>
        )}
        
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {tender.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {tender.location}
            </span>
          )}
          {tender.estimated_budget && (
            <span className="flex items-center gap-1">
              <Euro className="h-3 w-3" />
              {(tender.estimated_budget / 1000000).toFixed(1)}M€
            </span>
          )}
        </div>
        
        {deadline && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            isOverdue ? "text-destructive" : isUrgent ? "text-amber-600" : "text-muted-foreground"
          )}>
            {(isUrgent || isOverdue) && <AlertTriangle className="h-3 w-3" />}
            <Clock className="h-3 w-3" />
            <span>
              {isOverdue 
                ? "Expiré" 
                : formatDistanceToNow(deadline, { addSuffix: true, locale: fr })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TenderListView({ 
  tenders,
  onTenderClick,
  onDelete,
}: { 
  tenders: Tender[];
  onTenderClick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Référence</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Titre</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Deadline</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Budget</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tenders.map((tender) => {
            const deadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
            const isOverdue = deadline && isPast(deadline);
            
            return (
              <tr 
                key={tender.id} 
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => onTenderClick(tender.id)}
              >
                <td className="px-4 py-3 text-sm font-mono">{tender.reference}</td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">{tender.title}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{tender.client_name || "-"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-xs", TENDER_STATUS_COLORS[tender.status])}>
                    {TENDER_STATUS_LABELS[tender.status]}
                  </Badge>
                </td>
                <td className={cn(
                  "px-4 py-3 text-sm",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}>
                  {deadline ? format(deadline, "dd/MM/yyyy", { locale: fr }) : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {tender.estimated_budget 
                    ? `${(tender.estimated_budget / 1000000).toFixed(1)}M€`
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTenderClick(tender.id); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDelete(tender.id); }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
          {tenders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                Aucun concours trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
