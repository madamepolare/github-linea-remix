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

export default function Tenders() {
  const navigate = useNavigate();
  const { tenders, tendersByStatus, stats, isLoading, createTender, deleteTender } = useTenders();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateAndAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Déposez au moins un fichier DCE");
      return;
    }

    setIsCreating(true);
    try {
      // Generate a temporary reference
      const tempRef = `AO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      
      const result = await createTender.mutateAsync({
        reference: tempRef,
        title: "Nouveau concours - En attente d'analyse IA",
        status: 'repere',
      });

      // Navigate to the tender detail with files to upload
      // Store files in sessionStorage temporarily
      const fileData = await Promise.all(uploadedFiles.map(async (file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await file.arrayBuffer().then(buf => 
          btoa(String.fromCharCode(...new Uint8Array(buf)))
        ),
      })));
      sessionStorage.setItem(`tender-files-${result.id}`, JSON.stringify(fileData));
      
      setShowCreateDialog(false);
      setUploadedFiles([]);
      navigate(`/tenders/${result.id}?autoUpload=true`);
      toast.success("Concours créé, l'IA va analyser vos documents");
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsCreating(false);
    }
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

      {/* Create Dialog - File First */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Nouveau concours
            </DialogTitle>
            <DialogDescription>
              Déposez vos documents DCE et l'IA analysera automatiquement toutes les informations
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input
                type="file"
                id="dce-upload"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="dce-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "p-4 rounded-full transition-colors",
                    isDragging ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Upload className={cn(
                      "h-8 w-8 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">
                      Glissez vos fichiers DCE ici
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou cliquez pour sélectionner • PDF, Word, Excel
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
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
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setUploadedFiles([]);
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateAndAnalyze}
              disabled={uploadedFiles.length === 0 || isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>Création en cours...</>
              ) : (
                <>
                  Analyser avec l'IA
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
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
