import { useState, useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { RELATED_ENTITY_TYPES, RelatedEntityType } from "@/lib/taskTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FolderKanban, Target, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  project: FolderKanban,
  lead: Target,
  company: Building2,
  contact: User,
};

interface EntitySelectorProps {
  entityType: RelatedEntityType | null;
  entityId: string | null;
  onEntityTypeChange: (type: RelatedEntityType | null) => void;
  onEntityIdChange: (id: string | null) => void;
  className?: string;
  disabled?: boolean;
}

export function EntitySelector({
  entityType,
  entityId,
  onEntityTypeChange,
  onEntityIdChange,
  className,
  disabled,
}: EntitySelectorProps) {
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  const getEntitiesForType = (type: RelatedEntityType | null) => {
    switch (type) {
      case "project":
        return projects.map((p) => ({ id: p.id, name: p.name }));
      case "lead":
        return leads.map((l) => ({ id: l.id, name: l.title }));
      case "company":
        return allCompanies.map((c) => ({ id: c.id, name: c.name }));
      case "contact":
        return allContacts.map((c) => ({ id: c.id, name: c.name }));
      default:
        return [];
    }
  };

  const entities = getEntitiesForType(entityType);
  const selectedEntity = entities.find((e) => e.id === entityId);

  const handleTypeChange = (value: string) => {
    if (value === "none") {
      onEntityTypeChange(null);
      onEntityIdChange(null);
    } else {
      onEntityTypeChange(value as RelatedEntityType);
      onEntityIdChange(null);
    }
  };

  const handleEntityChange = (value: string) => {
    onEntityIdChange(value === "none" ? null : value);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Type d'entité</Label>
        <Select
          value={entityType || "none"}
          onValueChange={handleTypeChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Aucune liaison" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune liaison</SelectItem>
            {RELATED_ENTITY_TYPES.map((type) => {
              const Icon = entityIcons[type.id];
              return (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {entityType && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Sélectionner</Label>
          <Select
            value={entityId || "none"}
            onValueChange={handleEntityChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// Helper component to display a linked entity inline
interface LinkedEntityBadgeProps {
  entityType: RelatedEntityType | null;
  entityId: string | null;
  className?: string;
}

export function LinkedEntityBadge({ entityType, entityId, className }: LinkedEntityBadgeProps) {
  const { projects } = useProjects();
  const { leads } = useLeads();
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  if (!entityType || !entityId) return null;

  let entityName = "";
  switch (entityType) {
    case "project":
      entityName = projects.find((p) => p.id === entityId)?.name || "Projet";
      break;
    case "lead":
      entityName = leads.find((l) => l.id === entityId)?.title || "Lead";
      break;
    case "company":
      entityName = allCompanies.find((c) => c.id === entityId)?.name || "Entreprise";
      break;
    case "contact":
      entityName = allContacts.find((c) => c.id === entityId)?.name || "Contact";
      break;
  }

  const Icon = entityIcons[entityType];
  const typeLabel = RELATED_ENTITY_TYPES.find((t) => t.id === entityType)?.label || "";

  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{entityName}</span>
    </div>
  );
}