import { useState, useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useTenders } from "@/hooks/useTenders";
import { RELATED_ENTITY_TYPES, RelatedEntityType } from "@/lib/taskTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FolderKanban, Target, Building2, User, Home, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  project: FolderKanban,
  lead: Target,
  company: Building2,
  contact: User,
  tender: FileText,
};

const entityColors: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  project: { 
    bg: "bg-blue-50 hover:bg-blue-100", 
    border: "border-blue-200", 
    text: "text-blue-700",
    iconBg: "bg-blue-100"
  },
  lead: { 
    bg: "bg-amber-50 hover:bg-amber-100", 
    border: "border-amber-200", 
    text: "text-amber-700",
    iconBg: "bg-amber-100"
  },
  company: { 
    bg: "bg-purple-50 hover:bg-purple-100", 
    border: "border-purple-200", 
    text: "text-purple-700",
    iconBg: "bg-purple-100"
  },
  contact: { 
    bg: "bg-emerald-50 hover:bg-emerald-100", 
    border: "border-emerald-200", 
    text: "text-emerald-700",
    iconBg: "bg-emerald-100"
  },
  tender: { 
    bg: "bg-rose-50 hover:bg-rose-100", 
    border: "border-rose-200", 
    text: "text-rose-700",
    iconBg: "bg-rose-100"
  },
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
  const { tenders } = useTenders();

  // Separate internal and client projects
  const internalProjects = projects.filter(p => p.is_internal);
  const clientProjects = projects.filter(p => !p.is_internal);

  const getEntitiesForType = (type: RelatedEntityType | null) => {
    switch (type) {
      case "project":
        return projects.map((p) => ({ id: p.id, name: p.name, isInternal: p.is_internal }));
      case "lead":
        return leads.map((l) => ({ id: l.id, name: l.title, isInternal: false }));
      case "company":
        return allCompanies.map((c) => ({ id: c.id, name: c.name, isInternal: false }));
      case "contact":
        return allContacts.map((c) => ({ id: c.id, name: c.name, isInternal: false }));
      case "tender":
        return (tenders || []).map((t) => ({ id: t.id, name: t.title, isInternal: false }));
      default:
        return [];
    }
  };

  const entities = getEntitiesForType(entityType);
  const selectedEntity = entities.find((e) => e.id === entityId);

  const handleTypeClick = (typeId: RelatedEntityType) => {
    if (entityType === typeId) {
      // Clicking same type again deselects it
      onEntityTypeChange(null);
      onEntityIdChange(null);
    } else {
      onEntityTypeChange(typeId);
      onEntityIdChange(null);
    }
  };

  const handleEntityChange = (value: string) => {
    onEntityIdChange(value === "none" ? null : value);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Lier à une entité</Label>
        <div className="flex flex-wrap gap-2">
          {RELATED_ENTITY_TYPES.map((type) => {
            const Icon = entityIcons[type.id];
            const colors = entityColors[type.id];
            const isSelected = entityType === type.id;
            
            return (
              <motion.button
                key={type.id}
                type="button"
                onClick={() => handleTypeClick(type.id)}
                disabled={disabled}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
                  "text-sm font-medium",
                  isSelected 
                    ? cn(colors.bg, colors.border, colors.text, "border-2 shadow-sm")
                    : "bg-muted/30 border-border hover:bg-muted/50 text-muted-foreground",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center",
                  isSelected ? colors.iconBg : "bg-muted"
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span>{type.label}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full border shadow-sm flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5 text-muted-foreground" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {entityType && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <Label className="text-xs text-muted-foreground">Sélectionner</Label>
            <Select
              value={entityId || "none"}
              onValueChange={handleEntityChange}
              disabled={disabled}
            >
              <SelectTrigger className={cn(
                "border-2",
                entityType && entityColors[entityType]?.border
              )}>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {entityType === "project" ? (
                  <>
                    {internalProjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-1.5 text-xs">
                          <Home className="h-3 w-3" />
                          Projets internes
                        </SelectLabel>
                        {internalProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {clientProjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-1.5 text-xs">
                          <FolderKanban className="h-3 w-3" />
                          Projets clients
                        </SelectLabel>
                        {clientProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </>
                ) : (
                  entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>
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
  const { tenders } = useTenders();

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
    case "tender":
      entityName = (tenders || []).find((t) => t.id === entityId)?.title || "Appel d'offre";
      break;
  }

  const Icon = entityIcons[entityType];
  const colors = entityColors[entityType];
  const typeLabel = RELATED_ENTITY_TYPES.find((t) => t.id === entityType)?.label || "";

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs",
      colors?.bg, colors?.text,
      className
    )}>
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{entityName}</span>
    </div>
  );
}