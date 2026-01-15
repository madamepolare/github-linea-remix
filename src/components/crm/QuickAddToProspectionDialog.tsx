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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContacts } from "@/hooks/useContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useLeads, CreateLeadInput } from "@/hooks/useLeads";
import { Pipeline } from "@/hooks/useCRMPipelines";
import { Search, Building2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuickAddToProspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
}

type EntityType = "contact" | "company";

interface SelectableEntity {
  id: string;
  name: string;
  email?: string | null;
  type: EntityType;
  companyName?: string;
  industry?: string | null;
}

export function QuickAddToProspectionDialog({
  open,
  onOpenChange,
  pipeline,
}: QuickAddToProspectionDialogProps) {
  const { contacts } = useContacts();
  const { companies } = useCRMCompanies();
  const { createLead } = useLeads({ pipelineId: pipeline.id });

  const [entityType, setEntityType] = useState<EntityType>("company");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetStageId, setTargetStageId] = useState<string>(
    pipeline.stages?.[0]?.id || ""
  );
  const [isAdding, setIsAdding] = useState(false);

  const stages = pipeline.stages || [];

  // Build selectable entities list
  const entities: SelectableEntity[] = useMemo(() => {
    if (entityType === "contact") {
      return (contacts || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        type: "contact" as EntityType,
        companyName: c.company?.name,
      }));
    } else {
      return (companies || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        type: "company" as EntityType,
        industry: c.industry,
      }));
    }
  }, [entityType, contacts, companies]);

  // Filter by search
  const filteredEntities = useMemo(() => {
    if (!search) return entities;
    const searchLower = search.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(searchLower) ||
        e.email?.toLowerCase().includes(searchLower) ||
        e.companyName?.toLowerCase().includes(searchLower)
    );
  }, [entities, search]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
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
      const selectedEntities = entities.filter((e) => selectedIds.has(e.id));
      
      // Create leads for each selected entity
      for (const entity of selectedEntities) {
        const leadData: CreateLeadInput = {
          title: `Opportunité - ${entity.name}`,
          stage_id: targetStageId,
          pipeline_id: pipeline.id,
          crm_company_id: entity.type === "company" ? entity.id : undefined,
          contact_id: entity.type === "contact" ? entity.id : undefined,
          source: "prospection",
        };
        
        await createLead.mutateAsync(leadData);
      }

      toast.success(`${selectedIds.size} opportunité(s) créée(s)`);
      setSelectedIds(new Set());
      setSearch("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding leads:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter rapidement au pipeline</DialogTitle>
          <DialogDescription>
            Sélectionnez des contacts ou entreprises existants pour créer des opportunités
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Entity type tabs */}
          <Tabs value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" />
                Entreprises
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2">
                <User className="h-4 w-4" />
                Contacts
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Stage selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Étape cible :</span>
            <Select value={targetStageId} onValueChange={setTargetStageId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sélectionner une étape" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color || "#6366f1" }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Rechercher un${entityType === "company" ? "e entreprise" : " contact"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selection info */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedIds.size === filteredEntities.length && filteredEntities.length > 0
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </Button>
            {selectedIds.size > 0 && (
              <Badge variant="secondary">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Entities list */}
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-2 space-y-1">
              {filteredEntities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {search
                    ? "Aucun résultat"
                    : `Aucun${entityType === "company" ? "e entreprise" : " contact"} disponible`}
                </div>
              ) : (
                filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleSelection(entity.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(entity.id)}
                      onCheckedChange={() => toggleSelection(entity.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {entity.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entity.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entity.email || entity.companyName || entity.industry || "—"}
                      </p>
                    </div>
                    {entityType === "company" && entity.industry && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {entity.industry}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || !targetStageId || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout...
              </>
            ) : (
              `Ajouter ${selectedIds.size > 0 ? `(${selectedIds.size})` : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
