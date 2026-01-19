import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { format, formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  MapPin,
  Euro,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Eye,
  Building2,
  Theater,
  Trophy,
  XCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { THIN_STROKE } from "@/components/ui/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanBoard, type KanbanColumn as KanbanColumnType, KanbanCard } from "@/components/shared/KanbanBoard";
import { useTenders } from "@/hooks/useTenders";
import { 
  PIPELINE_STATUS_LABELS, 
  PIPELINE_STATUS_COLORS,
  TENDER_TYPE_LABELS,
  type Tender,
  type PipelineStatus,
} from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { CreateTenderDialog } from "@/components/tenders/CreateTenderDialog";

// Color mapping for pipeline status
const PIPELINE_COLUMN_COLORS: Record<PipelineStatus, string> = {
  a_approuver: "#f59e0b",
  en_cours: "#3b82f6",
  deposes: "#a855f7",
  gagnes: "#10b981",
  perdus: "#ef4444",
  no_go: "#f97316",
  archives: "#6b7280",
};

// Format budget helper
function formatBudget(amount: number | null): string {
  if (!amount) return "-";
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M€`;
  }
  return `${Math.round(amount / 1000)}k€`;
}

export default function Tenders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { "*": splat } = useParams();
  const { tenders, tendersByPipeline, stats, isLoading, deleteTender, updateTender } = useTenders();
  // Check if path ends with /list - use React Router's location
  const viewMode = location.pathname.endsWith("/list") ? "list" : "kanban";
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowCreateDialog(true);
    window.addEventListener("open-create-tender", handleOpen);
    return () => window.removeEventListener("open-create-tender", handleOpen);
  }, []);

  const filteredTenders = tenders.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pipelineColumns: PipelineStatus[] = ["a_approuver", "en_cours", "deposes", "gagnes", "perdus", "archives"];

  const handleDrop = (tenderId: string, fromColumnId: string, toColumnId: string) => {
    if (fromColumnId !== toColumnId) {
      updateTender.mutate({ id: tenderId, pipeline_status: toColumnId as PipelineStatus });
    }
  };

  // Build kanban columns
  const kanbanColumns: KanbanColumnType<Tender>[] = pipelineColumns.map((status) => ({
    id: status,
    label: PIPELINE_STATUS_LABELS[status],
    color: PIPELINE_COLUMN_COLORS[status],
    items: tendersByPipeline[status] || [],
  }));

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Stats Row with dopamine */}
        <div className="grid grid-cols-2 md:grid-cols-8 gap-3 px-6 py-4 border-b border-border bg-gradient-to-r from-background via-muted/30 to-background">
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-amber-600">{stats.aApprouver}</p>
            <p className="text-xs text-muted-foreground">À approuver</p>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-purple-600">{stats.deposes}</p>
            <p className="text-xs text-muted-foreground">Déposés</p>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4 text-emerald-600 group-hover:animate-bounce" />
              <p className="text-2xl font-bold text-emerald-600">{stats.gagnes}</p>
            </div>
            <p className="text-xs text-muted-foreground">Gagnés</p>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-red-500">{stats.perdus}</p>
            <p className="text-xs text-muted-foreground">Perdus</p>
          </motion.div>
          <motion.div 
            className="text-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-gray-500">{stats.archives}</p>
            <p className="text-xs text-muted-foreground">Archivés</p>
          </motion.div>
          <motion.div 
            className={cn(
              "text-center p-2 rounded-lg transition-colors",
              stats.tauxReussite >= 50 
                ? "hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
                : "hover:bg-amber-50 dark:hover:bg-amber-950/20"
            )}
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className={cn(
                "h-4 w-4",
                stats.tauxReussite >= 50 ? "text-emerald-600" : "text-amber-600"
              )} />
              <p className={cn(
                "text-2xl font-bold",
                stats.tauxReussite >= 50 ? "text-emerald-600" : "text-amber-600"
              )}>
                {stats.tauxReussite}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Réussite</p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : viewMode === "kanban" ? (
            <KanbanBoard<Tender>
              columns={kanbanColumns}
              isLoading={isLoading}
              onDrop={handleDrop}
              getItemId={(tender) => tender.id}
              emptyColumnContent="Aucun appel d'offre"
              renderCard={(tender, isDragging) => (
                <TenderKanbanCard
                  tender={tender}
                  onClick={() => navigate(`/tenders/${tender.id}`)}
                  onDelete={() => deleteTender.mutate(tender.id)}
                />
              )}
            />
          ) : (
            <TenderListView 
              tenders={filteredTenders} 
              onTenderClick={(id) => navigate(`/tenders/${id}`)}
              onDelete={(id) => deleteTender.mutate(id)}
            />
          )}
        </div>
      </div>

      <CreateTenderDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </>
  );
}

function TenderKanbanCard({ 
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
  const TypeIcon = tender.tender_type === "scenographie" ? Theater : Building2;
  
  // Get DOMINI fee from tender team (stored in required_team JSON)
  const dominiFee = (tender as any).domini_fee_percentage || null;

  // Check if this is a won/lost tender for special styling
  const isWon = tender.pipeline_status === 'gagnes';
  const isLost = tender.pipeline_status === 'perdus';

  return (
    <KanbanCard onClick={onClick}>
      <motion.div 
        className={cn(
          "space-y-2 relative",
          isWon && "after:absolute after:inset-0 after:bg-gradient-to-br after:from-emerald-500/5 after:to-transparent after:pointer-events-none after:rounded-md"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Won badge */}
        {isWon && (
          <motion.div 
            className="absolute -top-1 -right-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg">
              <Trophy className="h-3 w-3" />
            </div>
          </motion.div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <TypeIcon className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-mono">{tender.reference}</p>
            </div>
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
              <MapPin className="h-3 w-3" strokeWidth={THIN_STROKE} />
              {tender.location}
            </span>
          )}
          {tender.estimated_budget && (
            <span className="flex items-center gap-1">
              <Euro className="h-3 w-3" strokeWidth={THIN_STROKE} />
              {formatBudget(tender.estimated_budget)}
            </span>
          )}
        </div>

        {/* DOMINI fee display */}
        {dominiFee && (
          <div className="flex items-center gap-1.5 text-xs">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] px-1.5 py-0">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              {dominiFee}% honoraires
            </Badge>
          </div>
        )}
        
        {deadline && !isWon && !isLost && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            isOverdue ? "text-destructive" : isUrgent ? "text-amber-600" : "text-muted-foreground"
          )}>
            {(isUrgent || isOverdue) && <AlertTriangle className="h-3 w-3" strokeWidth={THIN_STROKE} />}
            <Clock className="h-3 w-3" strokeWidth={THIN_STROKE} />
            <span>
              {isOverdue 
                ? "Expiré" 
                : formatDistanceToNow(deadline, { addSuffix: true, locale: fr })}
            </span>
          </div>
        )}
      </motion.div>
    </KanbanCard>
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
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">MOA</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Deadline</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Budget</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Honoraires</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          <AnimatePresence>
            {tenders.map((tender, index) => {
              const deadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
              const isOverdue = deadline && isPast(deadline);
              const isWon = tender.pipeline_status === 'gagnes';
              const isLost = tender.pipeline_status === 'perdus';
              const dominiFee = (tender as any).domini_fee_percentage || null;
              
              return (
                <motion.tr 
                  key={tender.id} 
                  className={cn(
                    "hover:bg-muted/30 cursor-pointer transition-colors",
                    isWon && "bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/20"
                  )}
                  onClick={() => onTenderClick(tender.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <td className="px-4 py-3 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      {isWon && <Trophy className="h-4 w-4 text-emerald-600" />}
                      {isLost && <XCircle className="h-4 w-4 text-red-500" />}
                      {tender.reference}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{tender.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tender.client_name || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-xs", PIPELINE_STATUS_COLORS[tender.pipeline_status || 'a_approuver'])}>
                      {PIPELINE_STATUS_LABELS[tender.pipeline_status || 'a_approuver']}
                    </Badge>
                  </td>
                  <td className={cn(
                    "px-4 py-3 text-sm",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {deadline ? format(deadline, "dd/MM/yyyy", { locale: fr }) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatBudget(tender.estimated_budget)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {dominiFee ? (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {dominiFee}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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
                </motion.tr>
              );
            })}
          </AnimatePresence>
          {tenders.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                Aucun appel d'offre trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
