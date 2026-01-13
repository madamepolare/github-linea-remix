import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Target,
  ExternalLink,
  ArrowUpDown,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useLeads, Lead } from "@/hooks/useLeads";
import { CRMQuickFilters, FilterOption } from "./CRMQuickFilters";
import { CRMBulkActionsBar } from "./CRMBulkActionsBar";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface CRMLeadsTableProps {
  search?: string;
  onCreateLead: () => void;
}

const sourceLabels: Record<string, { label: string; color: string }> = {
  manual: { label: "Manuel", color: "bg-slate-500" },
  ai_prospection: { label: "Agent IA", color: "bg-violet-500" },
  website: { label: "Site web", color: "bg-blue-500" },
  referral: { label: "Recommandation", color: "bg-emerald-500" },
  cold_call: { label: "Appel", color: "bg-orange-500" },
  event: { label: "Événement", color: "bg-pink-500" },
  other: { label: "Autre", color: "bg-gray-500" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: "Nouveau", color: "bg-blue-500" },
  contacted: { label: "Contacté", color: "bg-yellow-500" },
  qualified: { label: "Qualifié", color: "bg-emerald-500" },
  proposal: { label: "Proposition", color: "bg-violet-500" },
  negotiation: { label: "Négociation", color: "bg-orange-500" },
  won: { label: "Gagné", color: "bg-green-500" },
  lost: { label: "Perdu", color: "bg-red-500" },
};

export function CRMLeadsTable({ search = "", onCreateLead }: CRMLeadsTableProps) {
  const navigate = useNavigate();
  const { leads, isLoading, deleteLead } = useLeads();
  
  const [searchQuery, setSearchQuery] = useState(search);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Filter by source
    if (selectedSource !== "all") {
      result = result.filter((l) => l.source === selectedSource);
    }

    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(searchLower) ||
          l.company?.name?.toLowerCase().includes(searchLower) ||
          l.contact?.name?.toLowerCase().includes(searchLower) ||
          l.contact?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortBy) {
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "estimated_value":
          aVal = Number(a.estimated_value) || 0;
          bVal = Number(b.estimated_value) || 0;
          break;
        case "probability":
          aVal = a.probability || 0;
          bVal = b.probability || 0;
          break;
        case "company":
          aVal = a.company?.name?.toLowerCase() || "";
          bVal = b.company?.name?.toLowerCase() || "";
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }
      
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, selectedSource, searchQuery, sortBy, sortDir]);

  // Source filter chips
  const sourceChips: FilterOption[] = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const source = l.source || "other";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const chips: FilterOption[] = [
      { id: "all", label: "Tous", count: leads.length },
    ];

    Object.entries(sourceLabels).forEach(([key, { label, color }]) => {
      if (sourceCounts[key]) {
        chips.push({
          id: key,
          label,
          color,
          count: sourceCounts[key],
        });
      }
    });

    return chips;
  }, [leads]);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [filteredLeads]);

  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => {
      deleteLead.mutate(id);
    });
    setSelectedIds(new Set());
  };

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailSheetOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isAllSelected = filteredLeads.length > 0 && selectedIds.size === filteredLeads.length;

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const fromAI = leads.filter((l) => l.source === "ai_prospection").length;
    const totalValue = leads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const won = leads.filter((l) => l.status === "won" || l.won_at).length;
    return { total, fromAI, totalValue, won };
  }, [leads]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-7 w-7 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Target}
            title="Aucun lead"
            description="Créez votre premier lead manuellement ou utilisez l'Agent IA pour prospecter automatiquement."
            action={{ label: "Créer un lead", onClick: onCreateLead }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total leads</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-xs text-muted-foreground">Via Agent IA</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.fromAI}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Valeur totale</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Gagnés</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.won}</p>
          </Card>
        </div>

        {/* Filters */}
        <CRMQuickFilters
          search={searchQuery}
          onSearchChange={setSearchQuery}
          categories={sourceChips}
          selectedCategory={selectedSource}
          onCategoryChange={setSelectedSource}
          placeholder="Rechercher un lead..."
          totalCount={leads.length}
          filteredCount={filteredLeads.length}
          onClearAllFilters={() => {
            setSearchQuery("");
            setSelectedSource("all");
          }}
        />

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-sm text-muted-foreground">Aucun lead trouvé</p>
                <Button variant="link" size="sm" onClick={() => {
                  setSearchQuery("");
                  setSelectedSource("all");
                }}>
                  Effacer les filtres
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 pr-0">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Sélectionner tout"
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead className="w-16">Source</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-1">
                        Lead
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "title" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden md:table-cell cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("company")}
                    >
                      <div className="flex items-center gap-1">
                        Entreprise / Contact
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "company" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden lg:table-cell cursor-pointer hover:text-foreground text-right"
                      onClick={() => handleSort("estimated_value")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Valeur
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "estimated_value" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="hidden sm:table-cell w-24 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("probability")}
                    >
                      <div className="flex items-center gap-1">
                        Proba.
                        <ArrowUpDown className={cn(
                          "h-3 w-3",
                          sortBy === "probability" ? "text-foreground" : "text-muted-foreground/50"
                        )} />
                      </div>
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">Étape</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead, index) => {
                    const isSelected = selectedIds.has(lead.id);
                    const source = sourceLabels[lead.source || "other"] || sourceLabels.other;
                    const status = statusLabels[lead.status] || statusLabels.new;
                    
                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                        className={cn(
                          "group cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                        )}
                        onClick={() => openLeadDetail(lead)}
                      >
                        <TableCell className="py-2 pr-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(lead.id, checked as boolean)}
                            aria-label={`Sélectionner ${lead.title}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px] font-medium text-white px-1.5 py-0", source.color)}
                          >
                            {lead.source === "ai_prospection" ? (
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                            ) : null}
                            {source.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate leading-tight">
                              {lead.title}
                            </p>
                            {lead.next_action_date && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(lead.next_action_date), "d MMM", { locale: fr })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden md:table-cell">
                          <div className="space-y-1">
                            {lead.company && (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-sm truncate">{lead.company.name}</span>
                              </div>
                            )}
                            {lead.contact && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {lead.contact.name}
                                  {lead.contact.email && (
                                    <span className="ml-1 opacity-70">• {lead.contact.email}</span>
                                  )}
                                </span>
                              </div>
                            )}
                            {!lead.company && !lead.contact && (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden lg:table-cell text-right">
                          <span className="font-medium text-sm">
                            {formatCurrency(Number(lead.estimated_value))}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={lead.probability || 0} 
                              className="h-1.5 w-12"
                            />
                            <span className="text-xs text-muted-foreground">
                              {lead.probability || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 hidden xl:table-cell">
                          {lead.stage ? (
                            <Badge 
                              variant="outline" 
                              className="text-[10px]"
                              style={{ borderColor: lead.stage.color || undefined }}
                            >
                              {lead.stage.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteLead.mutate(lead.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Bulk actions */}
      <CRMBulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={handleBulkDelete}
        entityType="leads"
      />

      {/* Lead detail sheet */}
      {selectedLead && (
        <LeadDetailSheet
          lead={selectedLead}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
        />
      )}
    </>
  );
}
