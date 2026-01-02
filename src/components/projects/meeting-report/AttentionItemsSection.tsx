import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { DebouncedInput, DebouncedTextarea } from "@/components/ui/debounced-input";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, AlertTriangle, Trash2, Calendar, Users, Building2, Package, Search, ArrowUpDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MeetingAttentionItem, CreateAttentionItemInput } from "@/hooks/useMeetingAttentionItems";

import { ProjectMOEMember } from "@/hooks/useProjectMOE";

interface Company {
  id: string;
  name: string;
}

interface AttentionItemsSectionProps {
  items: MeetingAttentionItem[];
  companies: Company[];
  lots: { id: string; name: string; crm_company_id: string | null }[];
  moeTeam: ProjectMOEMember[];
  meetingId: string;
  onCreateItem: (item: CreateAttentionItemInput) => void;
  onUpdateItem: (id: string, updates: Partial<MeetingAttentionItem>) => void;
  onDeleteItem: (id: string) => void;
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Faible", color: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  high: { label: "Urgent", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  critical: { label: "Critique", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  bet: { label: "BET", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  entreprise: { label: "Entreprise", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  moa: { label: "MOA", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  other: { label: "Autre", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export function AttentionItemsSection({
  items,
  companies,
  lots,
  moeTeam,
  meetingId,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}: AttentionItemsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
    assignee_type: "all" | "specific" | "custom";
    assignee_company_ids: string[];
    assignee_lot_ids: string[];
    assignee_names: string[];
    description: string;
    urgency: "low" | "normal" | "high" | "critical";
    due_date: string | null;
  }>({
    assignee_type: "all",
    assignee_company_ids: [],
    assignee_lot_ids: [],
    assignee_names: [],
    description: "",
    urgency: "normal",
    due_date: null,
  });
  const [customName, setCustomName] = useState("");

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProgress, setFilterProgress] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created" | "urgency" | "due_date" | "progress">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };

  // Build assignee options for filter
  const assigneeOptions = useMemo(() => {
    const options: { value: string; label: string; type: "lot" | "company" | "name" }[] = [];
    
    // Add lots
    lots.forEach(lot => {
      options.push({ value: `lot:${lot.id}`, label: lot.name, type: "lot" });
    });
    
    // Add companies (deduplicated)
    const addedCompanyIds = new Set<string>();
    companies.forEach(company => {
      if (!addedCompanyIds.has(company.id)) {
        options.push({ value: `company:${company.id}`, label: company.name, type: "company" });
        addedCompanyIds.add(company.id);
      }
    });
    
    // Add custom names from items
    const customNames = new Set<string>();
    items.forEach(item => {
      item.assignee_names?.forEach(name => customNames.add(name));
    });
    customNames.forEach(name => {
      options.push({ value: `name:${name}`, label: name, type: "name" });
    });
    
    return options;
  }, [lots, companies, items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.description.toLowerCase().includes(query) ||
        (item.comment && item.comment.toLowerCase().includes(query))
      );
    }

    // Urgency filter
    if (filterUrgency !== "all") {
      result = result.filter(item => item.urgency === filterUrgency);
    }

    // Type filter
    if (filterType !== "all") {
      result = result.filter(item => item.stakeholder_type === filterType);
    }

    // Progress filter
    if (filterProgress !== "all") {
      if (filterProgress === "incomplete") {
        result = result.filter(item => item.progress < 100);
      } else if (filterProgress === "complete") {
        result = result.filter(item => item.progress === 100);
      }
    }

    // Assignee filter
    if (filterAssignee !== "all") {
      const [type, id] = filterAssignee.split(":");
      result = result.filter(item => {
        if (item.assignee_type === "all") return true; // "Tous" matches all filters
        
        if (type === "lot") {
          return item.assignee_lot_ids?.includes(id);
        } else if (type === "company") {
          return item.assignee_company_ids?.includes(id);
        } else if (type === "name") {
          return item.assignee_names?.includes(id);
        }
        return false;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "urgency":
          comparison = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
          break;
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "progress":
          comparison = a.progress - b.progress;
          break;
        case "created":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [items, searchQuery, filterUrgency, filterType, filterProgress, filterAssignee, sortBy, sortOrder]);

  const hasActiveFilters = searchQuery || filterUrgency !== "all" || filterType !== "all" || filterProgress !== "all" || filterAssignee !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setFilterUrgency("all");
    setFilterType("all");
    setFilterProgress("all");
    setFilterAssignee("all");
  };

  // Get MOE companies (BET, architects, etc.) - deduplicated
  const moeCompanies = moeTeam
    .filter(m => m.crm_company_id && m.crm_company)
    .reduce((acc, m) => {
      if (!acc.find(c => c.id === m.crm_company_id)) {
        acc.push({
          id: m.crm_company_id!,
          name: m.crm_company!.name,
          role: m.role,
        });
      }
      return acc;
    }, [] as { id: string; name: string; role: string }[]);

  // Get lot companies - deduplicated
  const lotCompanies = lots
    .filter(l => l.crm_company_id)
    .reduce((acc, l) => {
      const company = companies.find(c => c.id === l.crm_company_id);
      if (company && !acc.find(c => c.id === company.id)) {
        acc.push({ ...company, lotName: l.name });
      }
      return acc;
    }, [] as (Company & { lotName: string })[]);

  const handleAddItem = () => {
    if (!newItem.description.trim()) return;
    
    // Determine stakeholder_type based on selections
    let stakeholder_type: "bet" | "entreprise" | "moa" | "other" = "other";
    if (newItem.assignee_type === "all") {
      stakeholder_type = "entreprise";
    } else if (newItem.assignee_lot_ids.length > 0) {
      stakeholder_type = "entreprise";
    } else if (newItem.assignee_company_ids.some(id => lotCompanies.find(c => c.id === id))) {
      stakeholder_type = "entreprise";
    } else if (newItem.assignee_company_ids.some(id => moeCompanies.find(c => c.id === id))) {
      stakeholder_type = "bet";
    } else if (newItem.assignee_names.length > 0) {
      stakeholder_type = "other";
    }
    
    onCreateItem({
      meeting_id: meetingId,
      assignee_type: newItem.assignee_type,
      assignee_company_ids: newItem.assignee_company_ids,
      assignee_lot_ids: newItem.assignee_lot_ids,
      assignee_names: newItem.assignee_names,
      stakeholder_type,
      description: newItem.description,
      urgency: newItem.urgency,
      due_date: newItem.due_date,
      comment: null,
      progress: 0,
    });

    setNewItem({
      assignee_type: "all",
      assignee_company_ids: [],
      assignee_lot_ids: [],
      assignee_names: [],
      description: "",
      urgency: "normal",
      due_date: null,
    });
    setIsAddDialogOpen(false);
  };

  const toggleCompanySelection = (companyId: string) => {
    const ids = newItem.assignee_company_ids.includes(companyId)
      ? newItem.assignee_company_ids.filter(id => id !== companyId)
      : [...newItem.assignee_company_ids, companyId];
    const hasSelection = ids.length > 0 || newItem.assignee_lot_ids.length > 0 || newItem.assignee_names.length > 0;
    setNewItem({ ...newItem, assignee_company_ids: ids, assignee_type: hasSelection ? "specific" : "all" });
  };

  const toggleLotSelection = (lotId: string) => {
    const ids = newItem.assignee_lot_ids.includes(lotId)
      ? newItem.assignee_lot_ids.filter(id => id !== lotId)
      : [...newItem.assignee_lot_ids, lotId];
    const hasSelection = ids.length > 0 || newItem.assignee_company_ids.length > 0 || newItem.assignee_names.length > 0;
    setNewItem({ ...newItem, assignee_lot_ids: ids, assignee_type: hasSelection ? "specific" : "all" });
  };

  const updateAssigneeType = () => {
    const hasSelection = newItem.assignee_lot_ids.length > 0 || 
                         newItem.assignee_company_ids.length > 0 || 
                         newItem.assignee_names.length > 0;
    return hasSelection ? "specific" : "all";
  };

  const addCustomName = () => {
    if (!customName.trim()) return;
    setNewItem({
      ...newItem,
      assignee_names: [...newItem.assignee_names, customName.trim()],
      assignee_type: "custom",
    });
    setCustomName("");
  };

  const getAssigneeDisplay = (item: MeetingAttentionItem) => {
    if (item.assignee_type === "all") {
      return "Tous";
    }
    const parts: string[] = [];
    
    // Add lot names
    if (item.assignee_lot_ids && item.assignee_lot_ids.length > 0) {
      const lotNames = item.assignee_lot_ids
        .map(id => lots.find(l => l.id === id)?.name)
        .filter(Boolean);
      if (lotNames.length > 0) parts.push(...lotNames as string[]);
    }
    
    // Add company names
    if (item.assignee_company_ids && item.assignee_company_ids.length > 0) {
      const companyNames = item.assignee_company_ids
        .map(id => companies.find(c => c.id === id)?.name)
        .filter(Boolean);
      if (companyNames.length > 0) parts.push(...companyNames as string[]);
    }
    
    // Add custom names
    if (item.assignee_names && item.assignee_names.length > 0) {
      parts.push(...item.assignee_names);
    }
    
    return parts.length > 0 ? parts.join(", ") : "Non défini";
  };

  const progressSteps = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-3">
      {/* Filters & Sort Bar */}
      {items.length > 0 && (
        <div className="space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-8 h-8 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter & Sort row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" />
              <span>Filtrer:</span>
            </div>

            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="bet">BET</SelectItem>
                <SelectItem value="entreprise">Entreprise</SelectItem>
                <SelectItem value="moa">MOA</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProgress} onValueChange={setFilterProgress}>
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue placeholder="Avancement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="incomplete">En cours</SelectItem>
                <SelectItem value="complete">Terminé</SelectItem>
              </SelectContent>
            </Select>

            {assigneeOptions.length > 0 && (
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue placeholder="Destinataire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {assigneeOptions.filter(o => o.type === "lot").length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Lots</div>
                      {assigneeOptions.filter(o => o.type === "lot").map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-amber-500" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {assigneeOptions.filter(o => o.type === "company").length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Entreprises</div>
                      {assigneeOptions.filter(o => o.type === "company").map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-blue-500" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {assigneeOptions.filter(o => o.type === "name").length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Autres</div>
                      {assigneeOptions.filter(o => o.type === "name").map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}

            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpDown className="h-3 w-3" />
              <span>Trier:</span>
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-7 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date création</SelectItem>
                <SelectItem value="urgency">Urgence</SelectItem>
                <SelectItem value="due_date">Échéance</SelectItem>
                <SelectItem value="progress">Avancement</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className={cn("h-3 w-3", sortOrder === "asc" && "rotate-180")} />
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            )}
          </div>

          {/* Results count */}
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              {filteredAndSortedItems.length} résultat{filteredAndSortedItems.length > 1 ? "s" : ""} sur {items.length}
            </p>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun point abordé</p>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun résultat</p>
          <Button variant="link" size="sm" onClick={clearFilters}>Effacer les filtres</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedItems.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 space-y-3 bg-card">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-xs", typeConfig[item.stakeholder_type]?.color)}>
                    {typeConfig[item.stakeholder_type]?.label}
                  </Badge>
                  <span className="font-medium text-sm flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {getAssigneeDisplay(item)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={item.urgency}
                    onValueChange={(v) => onUpdateItem(item.id, { urgency: v as MeetingAttentionItem["urgency"] })}
                  >
                    <SelectTrigger className="h-7 w-[90px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Urgent</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onDeleteItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <DebouncedTextarea
                value={item.description}
                onChange={(value) => onUpdateItem(item.id, { description: value })}
                placeholder="Description..."
                rows={2}
                className="resize-none text-sm"
              />

              {/* Footer row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <InlineDatePicker
                    value={item.due_date ? parseISO(item.due_date) : undefined}
                    onChange={(date) => onUpdateItem(item.id, { due_date: date?.toISOString().split('T')[0] || null })}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.progress}%</span>
                  <div className="flex gap-0.5">
                    {progressSteps.map((step) => (
                      <button
                        key={step}
                        type="button"
                        className={cn(
                          "w-5 h-2 rounded-sm transition-colors",
                          item.progress >= step ? "bg-primary" : "bg-muted"
                        )}
                        onClick={() => onUpdateItem(item.id, { progress: step })}
                        title={`${step}%`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <DebouncedInput
                value={item.comment || ""}
                onChange={(value) => onUpdateItem(item.id, { comment: value })}
                placeholder="Commentaire..."
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Ajouter un point abordé
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau point abordé</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Unified Assignees Selection */}
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="space-y-2 border rounded-lg p-3 max-h-64 overflow-y-auto">
                {/* All option */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newItem.assignee_type === "all" && newItem.assignee_company_ids.length === 0 && newItem.assignee_lot_ids.length === 0 && newItem.assignee_names.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewItem({ ...newItem, assignee_type: "all", assignee_company_ids: [], assignee_lot_ids: [], assignee_names: [] });
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Tous</span>
                </label>
                
                {/* Lots section */}
                {lots.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-1">Lots</p>
                    {lots.map((lot) => (
                      <label key={lot.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newItem.assignee_lot_ids.includes(lot.id)}
                          onCheckedChange={() => toggleLotSelection(lot.id)}
                        />
                        <Package className="h-3 w-3 text-amber-500" />
                        <span className="text-sm">{lot.name}</span>
                      </label>
                    ))}
                  </>
                )}
                
                {/* Lot Companies (Entreprises) */}
                {lotCompanies.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-1">Entreprises (lots)</p>
                    {lotCompanies.map((company) => (
                      <label key={`lot-${company.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newItem.assignee_company_ids.includes(company.id)}
                          onCheckedChange={() => toggleCompanySelection(company.id)}
                        />
                        <Building2 className="h-3 w-3 text-amber-500" />
                        <span className="text-sm">{company.name}</span>
                        <span className="text-xs text-muted-foreground">({company.lotName})</span>
                      </label>
                    ))}
                  </>
                )}
                
                {/* MOE Companies (BET, MOA, etc.) */}
                {moeCompanies.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-1">Équipe MOE (BET, MOA...)</p>
                    {moeCompanies.map((company) => (
                      <label key={`moe-${company.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newItem.assignee_company_ids.includes(company.id)}
                          onCheckedChange={() => toggleCompanySelection(company.id)}
                        />
                        <Building2 className="h-3 w-3 text-purple-500" />
                        <span className="text-sm">{company.name}</span>
                        <span className="text-xs text-muted-foreground">({company.role})</span>
                      </label>
                    ))}
                  </>
                )}

                {/* Custom names */}
                {newItem.assignee_names.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    <p className="text-xs font-medium text-muted-foreground mb-1">Autres</p>
                    {newItem.assignee_names.map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const names = newItem.assignee_names.filter((_, i) => i !== idx);
                            const hasSelection = names.length > 0 || newItem.assignee_lot_ids.length > 0 || newItem.assignee_company_ids.length > 0;
                            setNewItem({
                              ...newItem,
                              assignee_names: names,
                              assignee_type: hasSelection ? "custom" : "all",
                            });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}

                {/* Add custom name */}
                <div className="border-t my-2" />
                <div className="flex gap-2">
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ajouter un nom personnalisé..."
                    className="flex-1 h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomName())}
                  />
                  <Button type="button" variant="outline" size="sm" className="h-8" onClick={addCustomName}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {lots.length === 0 && lotCompanies.length === 0 && moeCompanies.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Aucun lot ni entreprise dans le projet. Ajoutez des noms personnalisés.
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Description du point abordé..."
                rows={3}
              />
            </div>

            {/* Urgency & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urgence</Label>
                <Select value={newItem.urgency} onValueChange={(v) => setNewItem({ ...newItem, urgency: v as typeof newItem.urgency })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Urgent</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Échéance</Label>
                <InlineDatePicker
                  value={newItem.due_date ? parseISO(newItem.due_date) : undefined}
                  onChange={(date) => setNewItem({ ...newItem, due_date: date?.toISOString().split('T')[0] || null })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddItem} disabled={!newItem.description.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
