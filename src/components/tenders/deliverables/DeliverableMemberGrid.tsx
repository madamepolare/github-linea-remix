import { useState, useMemo } from "react";
import { Check, Minus, Trash2, Calendar, Building2, CheckCircle2, Circle, Pencil, X, Save, Users, Plus, MoreHorizontal, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { TenderDeliverable, TenderTeamMember } from "@/lib/tenderTypes";

const RESPONSIBLE_TYPES = [
  { value: 'mandataire', label: 'Mandataire' },
  { value: 'tous', label: 'Tous les membres' },
  { value: 'cotraitant', label: 'Cotraitants' },
  { value: 'sous_traitant', label: 'Sous-traitant' },
];

const CANDIDATURE_TYPES = ["dc1", "dc2", "dc4", "urssaf", "kbis", "attestation_fiscale", "attestation_assurance", "references", "cv", "habilitations"];

interface DeliverableMemberGridProps {
  deliverables: TenderDeliverable[];
  teamMembers: TenderTeamMember[];
  onToggleMemberComplete: (deliverableId: string, companyId: string, currentValue: boolean) => void;
  onDelete: (deliverableId: string) => void;
  onUpdate?: (id: string, updates: Partial<TenderDeliverable>) => void;
  onAddDeliverable?: () => void;
}

export function DeliverableMemberGrid({
  deliverables,
  teamMembers,
  onToggleMemberComplete,
  onDelete,
  onUpdate,
  onAddDeliverable,
}: DeliverableMemberGridProps) {
  const [celebratedDeliverables, setCelebratedDeliverables] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [groupByType, setGroupByType] = useState(true);

  // Get unique companies from team (mandataire first, then cotraitants)
  const companies = teamMembers
    .filter(m => m.company?.id)
    .reduce((acc, m) => {
      if (!acc.find(c => c.id === m.company?.id)) {
        acc.push({
          id: m.company!.id,
          name: m.company!.name,
          role: m.role,
          isMandataire: m.role === "mandataire",
        });
      }
      return acc;
    }, [] as { id: string; name: string; role: string; isMandataire: boolean }[])
    .sort((a, b) => (a.isMandataire ? -1 : b.isMandataire ? 1 : 0));

  // Filter deliverables based on active tab
  const filteredDeliverables = useMemo(() => {
    if (activeTab === "all") return deliverables;
    
    return deliverables.filter(d => {
      // Filter by company
      if (d.responsible_company_ids && d.responsible_company_ids.length > 0) {
        return d.responsible_company_ids.includes(activeTab);
      }
      
      const company = companies.find(c => c.id === activeTab);
      if (!company) return false;
      
      switch (d.responsible_type) {
        case "mandataire":
          return company.isMandataire;
        case "tous":
          return true;
        case "cotraitant":
          return !company.isMandataire;
        default:
          return true;
      }
    });
  }, [deliverables, activeTab, companies]);

  // Group deliverables by type
  const groupedDeliverables = useMemo(() => {
    if (!groupByType) {
      return { all: filteredDeliverables };
    }
    
    return {
      candidature: filteredDeliverables.filter(d => CANDIDATURE_TYPES.includes(d.deliverable_type)),
      offre: filteredDeliverables.filter(d => !CANDIDATURE_TYPES.includes(d.deliverable_type)),
    };
  }, [filteredDeliverables, groupByType]);

  // Calculate if a company should have a checkbox for this deliverable
  const shouldHaveCheckbox = (deliverable: TenderDeliverable, companyId: string, isMandataire: boolean) => {
    if (deliverable.responsible_company_ids && deliverable.responsible_company_ids.length > 0) {
      return deliverable.responsible_company_ids.includes(companyId);
    }
    
    switch (deliverable.responsible_type) {
      case "mandataire":
        return isMandataire;
      case "tous":
        return true;
      case "cotraitant":
        return !isMandataire;
      default:
        return true;
    }
  };

  // Check if deliverable is complete
  const isDeliverableComplete = (deliverable: TenderDeliverable) => {
    const memberCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;
    
    for (const company of companies) {
      if (shouldHaveCheckbox(deliverable, company.id, company.isMandataire)) {
        if (!memberCompletion[company.id]) {
          return false;
        }
      }
    }
    return companies.length > 0;
  };

  // Calculate progress per company
  const getCompanyProgress = (companyId: string, isMandataire: boolean) => {
    let total = 0;
    let completed = 0;

    for (const d of deliverables) {
      if (shouldHaveCheckbox(d, companyId, isMandataire)) {
        total++;
        const memberCompletion = (d.member_completion || {}) as Record<string, boolean>;
        if (memberCompletion[companyId]) {
          completed++;
        }
      }
    }

    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const handleToggle = (deliverable: TenderDeliverable, companyId: string) => {
    const memberCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;
    const currentValue = memberCompletion[companyId] || false;
    
    onToggleMemberComplete(deliverable.id, companyId, currentValue);

    if (!currentValue) {
      const newCompletion = { ...memberCompletion, [companyId]: true };
      const willBeComplete = companies.every(company => {
        if (shouldHaveCheckbox(deliverable, company.id, company.isMandataire)) {
          return newCompletion[company.id];
        }
        return true;
      });

      if (willBeComplete && !celebratedDeliverables.includes(deliverable.id)) {
        setCelebratedDeliverables(prev => [...prev, deliverable.id]);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#22c55e", "#16a34a", "#15803d"],
        });
      }
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDeliverables.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDeliverables.map(d => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Edit handlers
  const startEdit = (deliverable: TenderDeliverable, field: string) => {
    setEditingId(deliverable.id);
    setEditingField(field);
    if (field === "name") {
      setEditValue(deliverable.name);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = (id: string) => {
    if (onUpdate && editingField === "name" && editValue.trim()) {
      onUpdate(id, { name: editValue.trim() });
    }
    cancelEdit();
  };

  const updateResponsibleType = (id: string, type: string) => {
    if (onUpdate) {
      onUpdate(id, { responsible_type: type, responsible_company_ids: [] });
    }
  };

  const updateResponsibleCompanies = (id: string, companyIds: string[]) => {
    if (onUpdate) {
      onUpdate(id, { responsible_company_ids: companyIds });
    }
  };

  // Bulk actions
  const bulkUpdateResponsible = (type: string) => {
    if (onUpdate) {
      selectedIds.forEach(id => {
        onUpdate(id, { responsible_type: type, responsible_company_ids: [] });
      });
    }
    setSelectedIds([]);
  };

  const bulkDelete = () => {
    selectedIds.forEach(id => onDelete(id));
    setSelectedIds([]);
  };

  const getResponsibleDisplay = (deliverable: TenderDeliverable) => {
    if (deliverable.responsible_company_ids && deliverable.responsible_company_ids.length > 0) {
      const assignedCompanies = companies.filter(c => 
        deliverable.responsible_company_ids?.includes(c.id)
      );
      if (assignedCompanies.length === 1) {
        return assignedCompanies[0].name;
      }
      return `${assignedCompanies.length} entreprises`;
    }
    return RESPONSIBLE_TYPES.find(t => t.value === deliverable.responsible_type)?.label || deliverable.responsible_type;
  };

  // Render a deliverable row
  const renderDeliverableRow = (deliverable: TenderDeliverable) => {
    const isComplete = isDeliverableComplete(deliverable);
    const memberCompletion = (deliverable.member_completion || {}) as Record<string, boolean>;
    const isEditing = editingId === deliverable.id;
    const isSelected = selectedIds.includes(deliverable.id);
    const isCandidature = CANDIDATURE_TYPES.includes(deliverable.deliverable_type);

    return (
      <motion.tr
        key={deliverable.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "border-b transition-colors group",
          isComplete && "bg-green-50/50 dark:bg-green-950/10",
          isSelected && "bg-primary/5"
        )}
      >
        <TableCell className="w-10">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={() => toggleSelect(deliverable.id)}
          />
        </TableCell>
        <TableCell className="w-8">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/40" />
          )}
        </TableCell>
        <TableCell className="min-w-[250px]">
          {isEditing && editingField === "name" ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(deliverable.id);
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(deliverable.id)}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium",
                isComplete && "text-green-700 dark:text-green-400"
              )}>
                {deliverable.name}
              </span>
              {onUpdate && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEdit(deliverable, "name")}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </TableCell>
        <TableCell className="w-40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-normal w-full justify-between">
                <span className="truncate">{getResponsibleDisplay(deliverable)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {RESPONSIBLE_TYPES.map(type => (
                <DropdownMenuItem 
                  key={type.value}
                  onClick={() => updateResponsibleType(deliverable.id, type.value)}
                >
                  {deliverable.responsible_type === type.value && (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  <span className={deliverable.responsible_type !== type.value ? "ml-6" : ""}>
                    {type.label}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Attribuer à des entreprises
              </div>
              {companies.map(company => (
                <DropdownMenuCheckboxItem
                  key={company.id}
                  checked={deliverable.responsible_company_ids?.includes(company.id) || false}
                  onCheckedChange={(checked) => {
                    const current = deliverable.responsible_company_ids || [];
                    const newIds = checked 
                      ? [...current, company.id]
                      : current.filter(id => id !== company.id);
                    updateResponsibleCompanies(deliverable.id, newIds);
                  }}
                >
                  {company.name}
                  {company.isMandataire && (
                    <Badge variant="secondary" className="ml-2 h-4 text-[9px]">M</Badge>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
        {companies.map(company => {
          const hasCheckbox = shouldHaveCheckbox(deliverable, company.id, company.isMandataire);
          const isChecked = memberCompletion[company.id] || false;

          return (
            <TableCell key={company.id} className="text-center w-20">
              {hasCheckbox ? (
                <div className="flex justify-center">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(deliverable, company.id)}
                    className={cn(
                      "h-5 w-5 transition-all",
                      isChecked && "bg-green-600 border-green-600 data-[state=checked]:bg-green-600"
                    )}
                  />
                </div>
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
              )}
            </TableCell>
          );
        })}
        <TableCell className="w-24">
          {deliverable.due_date ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(deliverable.due_date), "d MMM", { locale: fr })}
            </span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </TableCell>
        <TableCell className="w-20">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onUpdate && startEdit(deliverable, "name")}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier le nom
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(deliverable.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </motion.tr>
    );
  };

  // Render a section of deliverables
  const renderSection = (title: string, items: TenderDeliverable[], variant: "candidature" | "offre") => {
    if (items.length === 0) return null;
    
    const completedCount = items.filter(d => isDeliverableComplete(d)).length;
    const progress = Math.round((completedCount / items.length) * 100);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={cn(
                "h-6 px-2.5 font-medium",
                variant === "candidature" 
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
              )}
            >
              {title}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{items.length} complété{completedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="w-24 h-2" />
            <span className={cn(
              "text-xs font-medium w-8",
              progress === 100 ? "text-green-600" : "text-muted-foreground"
            )}>
              {progress}%
            </span>
          </div>
        </div>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox 
                    checked={items.every(d => selectedIds.includes(d.id)) && items.length > 0}
                    onCheckedChange={() => {
                      const allSelected = items.every(d => selectedIds.includes(d.id));
                      if (allSelected) {
                        setSelectedIds(prev => prev.filter(id => !items.find(d => d.id === id)));
                      } else {
                        setSelectedIds(prev => [...new Set([...prev, ...items.map(d => d.id)])]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="min-w-[250px]">Livrable</TableHead>
                <TableHead className="w-40">Responsable</TableHead>
                {companies.map(company => (
                  <TableHead key={company.id} className="w-20 text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-0.5 cursor-default">
                            <span className="text-xs font-medium truncate max-w-[70px]">
                              {company.name.length > 8 ? company.name.slice(0, 8) + "…" : company.name}
                            </span>
                            {company.isMandataire && (
                              <Badge variant="secondary" className="h-4 text-[9px] px-1">M</Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{company.role}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
                <TableHead className="w-24">Échéance</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {items.map(renderDeliverableRow)}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  if (companies.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Ajoutez des membres à l'équipe pour activer le suivi multi-colonnes</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs and controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              Tous
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {deliverables.length}
              </Badge>
            </TabsTrigger>
            {companies.map(company => {
              const progress = getCompanyProgress(company.id, company.isMandataire);
              return (
                <TabsTrigger key={company.id} value={company.id} className="gap-2">
                  <span className="truncate max-w-[100px]">{company.name}</span>
                  <Badge 
                    variant={progress.percentage === 100 ? "default" : "secondary"} 
                    className={cn(
                      "h-5 px-1.5 text-[10px]",
                      progress.percentage === 100 && "bg-green-600"
                    )}
                  >
                    {progress.completed}/{progress.total}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={groupByType ? "secondary" : "outline"}
            size="sm"
            onClick={() => setGroupByType(!groupByType)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Grouper par type
          </Button>
          {onAddDeliverable && (
            <Button size="sm" onClick={onAddDeliverable}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">
                  {selectedIds.length} livrable{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Modifier responsable
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {RESPONSIBLE_TYPES.map(type => (
                        <DropdownMenuItem 
                          key={type.value}
                          onClick={() => bulkUpdateResponsible(type.value)}
                        >
                          {type.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={bulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedIds([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress per member (compact) */}
      <Card className="p-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(companies.length, 4)}, 1fr)` }}>
          {companies.map(company => {
            const progress = getCompanyProgress(company.id, company.isMandataire);
            return (
              <div 
                key={company.id} 
                className={cn(
                  "space-y-1 p-2 rounded-md cursor-pointer transition-colors",
                  activeTab === company.id ? "bg-primary/10" : "hover:bg-muted/50"
                )}
                onClick={() => setActiveTab(company.id)}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex items-center gap-1.5">
                    {company.isMandataire && (
                      <Badge variant="default" className="h-4 text-[9px] px-1">M</Badge>
                    )}
                    <span className="truncate">{company.name}</span>
                  </span>
                  <span className={cn(
                    "text-xs font-bold shrink-0",
                    progress.percentage === 100 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                <Progress 
                  value={progress.percentage} 
                  className={cn(
                    "h-1.5",
                    progress.percentage === 100 && "[&>div]:bg-green-500"
                  )} 
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Deliverables grouped or flat */}
      {groupByType ? (
        <div className="space-y-6">
          {renderSection("CANDIDATURE", groupedDeliverables.candidature || [], "candidature")}
          {renderSection("OFFRE", groupedDeliverables.offre || [], "offre")}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedIds.length === filteredDeliverables.length && filteredDeliverables.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="min-w-[250px]">Livrable</TableHead>
                <TableHead className="w-40">Responsable</TableHead>
                {companies.map(company => (
                  <TableHead key={company.id} className="w-20 text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-0.5 cursor-default">
                            <span className="text-xs font-medium truncate max-w-[70px]">
                              {company.name.length > 8 ? company.name.slice(0, 8) + "…" : company.name}
                            </span>
                            {company.isMandataire && (
                              <Badge variant="secondary" className="h-4 text-[9px] px-1">M</Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{company.role}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
                <TableHead className="w-24">Échéance</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredDeliverables.map(renderDeliverableRow)}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty state */}
      {filteredDeliverables.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun livrable pour ce filtre</p>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Complet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-4 w-4 text-muted-foreground/40" />
          <span>En cours</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Minus className="h-4 w-4 text-muted-foreground/30" />
          <span>Non concerné</span>
        </div>
      </div>
    </div>
  );
}
