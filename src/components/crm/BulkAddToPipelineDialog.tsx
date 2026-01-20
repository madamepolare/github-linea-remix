import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pipeline } from "@/hooks/useCRMPipelines";
import { useContactPipeline } from "@/hooks/useContactPipeline";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { Search, Building2, User, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkAddToPipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
}

type EntityType = "contact" | "company";

export function BulkAddToPipelineDialog({
  open,
  onOpenChange,
  pipeline,
}: BulkAddToPipelineDialogProps) {
  const { entries, addBulkEntries } = useContactPipeline(pipeline.id);
  const { companyCategories, betSpecialties, getCompanyTypeLabel } = useCRMSettings();

  const [entityType, setEntityType] = useState<EntityType>(
    pipeline.target_contact_type === "company" ? "company" : "contact"
  );
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetStageId, setTargetStageId] = useState<string>(
    pipeline.stages[0]?.id || ""
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [contactStatusFilter, setContactStatusFilter] = useState<string>("all");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch ALL contacts and companies with server-side search (large page size)
  const { contacts, isLoading: contactsLoading } = useContacts({ 
    search: entityType === "contact" ? search : undefined,
    pageSize: 1000 
  });
  const { companies, isLoading: companiesLoading } = useCRMCompanies({ 
    search: entityType === "company" ? search : undefined,
    pageSize: 1000
  });

  // Get already added entity IDs
  const existingContactIds = new Set(
    entries.filter((e) => e.contact_id).map((e) => e.contact_id)
  );
  const existingCompanyIds = new Set(
    entries.filter((e) => e.company_id).map((e) => e.company_id)
  );

  // Filter entities (search is now server-side, only apply local filters)
  const filteredEntities = useMemo(() => {
    if (entityType === "contact") {
      return (contacts || []).filter((c) => {
        if (existingContactIds.has(c.id)) return false;
        // Filter by contact status
        if (contactStatusFilter === "lead" && c.status !== "lead") {
          return false;
        }
        if (contactStatusFilter === "prospect" && c.contact_type !== "prospect") {
          return false;
        }
        if (contactStatusFilter === "confirmed" && (c.status === "lead" || c.contact_type === "prospect")) {
          return false;
        }
        return true;
      });
    } else {
      return (companies || []).filter((c) => {
        if (existingCompanyIds.has(c.id)) return false;
        if (categoryFilter !== "all" && c.industry !== categoryFilter) {
          return false;
        }
        if (specialtyFilter !== "all") {
          const specialties = c.bet_specialties || [];
          if (!specialties.includes(specialtyFilter)) {
            return false;
          }
        }
        return true;
      });
    }
  }, [
    entityType,
    contacts,
    companies,
    categoryFilter,
    specialtyFilter,
    contactStatusFilter,
    existingContactIds,
    existingCompanyIds,
  ]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredEntities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntities.map((e) => e.id)));
    }
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0 || !targetStageId) {
      toast.error("Sélectionnez au moins un élément");
      return;
    }

    setIsAdding(true);
    try {
      const entriesToAdd = Array.from(selectedIds).map((id) => ({
        contactId: entityType === "contact" ? id : undefined,
        companyId: entityType === "company" ? id : undefined,
        stageId: targetStageId,
      }));

      await addBulkEntries.mutateAsync(entriesToAdd);
      toast.success(`${selectedIds.size} entrée(s) ajoutée(s) au pipeline`);
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding entries:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsAdding(false);
    }
  };

  const allSelected = filteredEntities.length > 0 && selectedIds.size === filteredEntities.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Ajouter au pipeline "{pipeline.name}"
          </DialogTitle>
          <DialogDescription className="text-sm">
            Sélectionnez les éléments à ajouter
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Entity type toggle */}
            <div className="inline-flex rounded-lg border p-1 bg-muted/30">
              <button
                onClick={() => {
                  setEntityType("contact");
                  setSelectedIds(new Set());
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  entityType === "contact"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="h-4 w-4" />
                Contacts
              </button>
              <button
                onClick={() => {
                  setEntityType("company");
                  setSelectedIds(new Set());
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  entityType === "company"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Sociétés
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Stage selector */}
            <Select value={targetStageId} onValueChange={setTargetStageId}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Étape cible" />
              </SelectTrigger>
              <SelectContent>
                {pipeline.stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color || "#6B7280" }}
                      />
                      <span className="truncate">{stage.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters for contacts */}
          {entityType === "contact" && (
            <div className="flex flex-wrap gap-2">
              <Select value={contactStatusFilter} onValueChange={setContactStatusFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les contacts</SelectItem>
                  <SelectItem value="lead">Leads uniquement</SelectItem>
                  <SelectItem value="prospect">Prospects uniquement</SelectItem>
                  <SelectItem value="confirmed">Contacts confirmés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filters for companies */}
          {entityType === "company" && (
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {companyCategories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {categoryFilter === "bet" && (
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue placeholder="Spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes spécialités</SelectItem>
                    {betSpecialties.map((spec) => (
                      <SelectItem key={spec.key} value={spec.key}>
                        {spec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Selection header */}
          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </span>
            </label>
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="font-medium">
                  {selectedIds.size} sélectionné(s)
                </Badge>
              )}
              {selectedIds.size === 0 && `${filteredEntities.length} disponible(s)`}
            </span>
          </div>

          {/* Entity list */}
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            <div className="space-y-1 pb-2">
              {filteredEntities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Aucun élément disponible</p>
                </div>
              ) : (
                filteredEntities.map((entity) => {
                  const isSelected = selectedIds.has(entity.id);
                  return (
                    <div
                      key={entity.id}
                      onClick={() => toggleSelection(entity.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <Checkbox checked={isSelected} className="shrink-0" />
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                          src={
                            entityType === "contact"
                              ? (entity as any).avatar_url
                              : (entity as any).logo_url
                          }
                        />
                        <AvatarFallback className="text-xs font-medium">
                          {entity.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {entity.name}
                          </p>
                          {entityType === "contact" && (entity as any).status === "lead" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200">
                              Lead
                            </Badge>
                          )}
                          {entityType === "contact" && (entity as any).contact_type === "prospect" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200">
                              Prospect
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {(entity as any).email || (entity as any).phone || "—"}
                        </p>
                      </div>
                      {entityType === "company" && (entity as any).status && (
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] shrink-0 ${
                            (entity as any).status === "lead" 
                              ? "bg-amber-50 text-amber-700 border-amber-200" 
                              : ""
                          }`}
                        >
                          {(entity as any).status === "lead" ? "Lead" : (entity as any).status}
                        </Badge>
                      )}
                      {entityType === "company" && (entity as any).industry && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {(entity as any).industry}
                        </Badge>
                      )}
                      {entityType === "contact" && (entity as any).role && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(entity as any).role}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding || selectedIds.size === 0}
            className="min-w-[140px]"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout...
              </>
            ) : (
              `Ajouter ${selectedIds.size || ""} ${selectedIds.size > 1 ? "éléments" : "élément"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}