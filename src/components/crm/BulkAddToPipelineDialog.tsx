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
import { Label } from "@/components/ui/label";
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
import { DEFAULT_COMPANY_CATEGORIES, DEFAULT_BET_SPECIALTIES } from "@/lib/crmDefaults";
import { Search, Building2, User, Plus, Filter } from "lucide-react";
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
  const { entries, addEntry, addBulkEntries } = useContactPipeline(pipeline.id);
  const { contacts } = useContacts();
  const { companies } = useCRMCompanies();

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
  const [isAdding, setIsAdding] = useState(false);

  // Get already added entity IDs
  const existingContactIds = new Set(
    entries.filter((e) => e.contact_id).map((e) => e.contact_id)
  );
  const existingCompanyIds = new Set(
    entries.filter((e) => e.company_id).map((e) => e.company_id)
  );

  // Filter entities
  const filteredEntities = useMemo(() => {
    if (entityType === "contact") {
      return (contacts || []).filter((c) => {
        // Exclude already added
        if (existingContactIds.has(c.id)) return false;
        // Search filter
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      });
    } else {
      return (companies || []).filter((c) => {
        // Exclude already added
        if (existingCompanyIds.has(c.id)) return false;
        // Search filter
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        // Category filter
        if (categoryFilter !== "all" && c.industry !== categoryFilter) {
          return false;
        }
        // BET specialty filter
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
    search,
    categoryFilter,
    specialtyFilter,
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
      toast.error("Sélectionnez au moins un élément et une étape");
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
      toast.success(`${selectedIds.size} entrée(s) ajoutée(s)`);
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding entries:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter au pipeline
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les contacts ou sociétés à ajouter à "{pipeline.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type toggle and search */}
          <div className="flex flex-wrap gap-4">
            {/* Entity type */}
            <div className="flex gap-2">
              <Button
                variant={entityType === "contact" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setEntityType("contact");
                  setSelectedIds(new Set());
                }}
              >
                <User className="h-4 w-4 mr-1" />
                Contacts
              </Button>
              <Button
                variant={entityType === "company" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setEntityType("company");
                  setSelectedIds(new Set());
                }}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Sociétés
              </Button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filters for companies */}
          {entityType === "company" && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {DEFAULT_COMPANY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {categoryFilter === "bet" && (
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Spécialité BET" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes spécialités</SelectItem>
                    {DEFAULT_BET_SPECIALTIES.map((spec) => (
                      <SelectItem key={spec.key} value={spec.key}>
                        {spec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Target stage */}
          <div className="space-y-2">
            <Label>Étape cible</Label>
            <Select value={targetStageId} onValueChange={setTargetStageId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Sélectionner une étape" />
              </SelectTrigger>
              <SelectContent>
                {pipeline.stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: stage.color || "#6B7280" }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  filteredEntities.length > 0 &&
                  selectedIds.size === filteredEntities.length
                }
                onCheckedChange={toggleAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} sélectionné(s)`
                  : `${filteredEntities.length} disponible(s)`}
              </span>
            </div>
          </div>

          {/* Entity list */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {filteredEntities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun élément à afficher
                </div>
              ) : (
                filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                      selectedIds.has(entity.id) ? "bg-accent" : ""
                    }`}
                    onClick={() => toggleSelection(entity.id)}
                  >
                    <Checkbox checked={selectedIds.has(entity.id)} />
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          entityType === "contact"
                            ? (entity as any).avatar_url
                            : (entity as any).logo_url
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {entity.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {entity.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(entity as any).email || "Pas d'email"}
                      </p>
                    </div>
                    {entityType === "company" && (entity as any).industry && (
                      <Badge variant="outline" className="text-xs">
                        {(entity as any).industry}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding || selectedIds.size === 0}
          >
            {isAdding
              ? "Ajout..."
              : `Ajouter ${selectedIds.size} élément(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
