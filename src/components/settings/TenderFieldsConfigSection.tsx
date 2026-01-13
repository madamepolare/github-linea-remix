import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Building2,
  MapPin,
  Euro,
  FileCheck,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Asterisk,
  GripVertical,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ALL_TENDER_FIELDS,
  FIELD_SECTIONS,
  type TenderFieldDefinition,
  type FieldSection,
} from "@/lib/tenderFieldsConfig";
import { useWorkspaceDisciplines } from "@/hooks/useWorkspaceDisciplines";
import { useTenderTypeConfigs } from "@/hooks/useTenderTypeConfigs";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  general: FileText,
  client: Building2,
  project: MapPin,
  financial: Euro,
  procedure: FileCheck,
  dates: Calendar,
  site_visit: MapPin,
  groupement: Users,
};

interface FieldConfigState {
  visible: boolean;
  required: boolean;
}

export function TenderFieldsConfigSection() {
  const { activeDisciplines } = useWorkspaceDisciplines();
  const { configs } = useTenderTypeConfigs();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general', 'dates']));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);
  
  // Field configurations state (would be saved to DB in real implementation)
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfigState>>(() => {
    const initial: Record<string, FieldConfigState> = {};
    ALL_TENDER_FIELDS.forEach(field => {
      initial[field.key] = {
        visible: field.defaultVisible ?? false,
        required: field.defaultRequired ?? false,
      };
    });
    return initial;
  });

  // Filter fields by search and discipline
  const filteredFields = useMemo(() => {
    let fields = ALL_TENDER_FIELDS;
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      fields = fields.filter(f => 
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query) ||
        f.section.toLowerCase().includes(query)
      );
    }
    
    // Filter by active disciplines
    fields = fields.filter(f => 
      !f.disciplines || f.disciplines.some(d => activeDisciplines.includes(d))
    );
    
    return fields;
  }, [searchQuery, activeDisciplines]);

  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const grouped: Record<string, TenderFieldDefinition[]> = {};
    FIELD_SECTIONS.forEach(section => {
      grouped[section.key] = filteredFields.filter(f => f.section === section.key);
    });
    return grouped;
  }, [filteredFields]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleFieldVisible = (fieldKey: string) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        visible: !prev[fieldKey].visible,
        // If hiding, also remove required
        required: !prev[fieldKey].visible ? prev[fieldKey].required : false,
      },
    }));
  };

  const toggleFieldRequired = (fieldKey: string) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        required: !prev[fieldKey].required,
        // If making required, also make visible
        visible: !prev[fieldKey].required ? true : prev[fieldKey].visible,
      },
    }));
  };

  const visibleCount = Object.values(fieldConfigs).filter(c => c.visible).length;
  const requiredCount = Object.values(fieldConfigs).filter(c => c.required).length;

  // Get unique tender types from configs
  const tenderTypes = configs.filter(c => activeDisciplines.includes(c.discipline_slug));

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Configuration des champs</h4>
          <p className="text-sm text-muted-foreground">
            Définissez quels champs sont visibles et requis pour chaque type d'AO
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            {visibleCount} visibles
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Asterisk className="h-3 w-3" />
            {requiredCount} requis
          </Badge>
        </div>
      </div>

      {/* Filtre par type d'AO */}
      {tenderTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtrer par type :</span>
          <Button
            variant={selectedTypeKey === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTypeKey(null)}
          >
            Tous
          </Button>
          {tenderTypes.map(type => (
            <Button
              key={type.id}
              variant={selectedTypeKey === type.type_key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTypeKey(type.type_key)}
              className="gap-1"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.label}
            </Button>
          ))}
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un champ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des sections et champs */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-2">
          {FIELD_SECTIONS.map(section => {
            const sectionFields = fieldsBySection[section.key] || [];
            if (sectionFields.length === 0) return null;
            
            const Icon = SECTION_ICONS[section.key] || FileText;
            const isExpanded = expandedSections.has(section.key);
            const visibleInSection = sectionFields.filter(f => fieldConfigs[f.key]?.visible).length;

            return (
              <Collapsible
                key={section.key}
                open={isExpanded}
                onOpenChange={() => toggleSection(section.key)}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium flex-1 text-left">{section.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {visibleInSection}/{sectionFields.length}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    <div className="pl-6 pt-2 space-y-1">
                      {sectionFields.map((field, idx) => {
                        const config = fieldConfigs[field.key] || { visible: false, required: false };
                        
                        return (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-colors group",
                              config.visible ? "bg-card" : "bg-muted/30 opacity-60"
                            )}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium text-sm",
                                  !config.visible && "text-muted-foreground"
                                )}>
                                  {field.label}
                                </span>
                                {field.unit && (
                                  <Badge variant="outline" className="text-xs">
                                    {field.unit}
                                  </Badge>
                                )}
                                {field.disciplines && (
                                  <Badge variant="secondary" className="text-xs">
                                    {field.disciplines.join(', ')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {field.dbColumn} • {field.type}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Visible toggle */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleFieldVisible(field.key)}
                                  className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    config.visible 
                                      ? "bg-primary/10 text-primary" 
                                      : "bg-muted text-muted-foreground hover:text-foreground"
                                  )}
                                  title={config.visible ? "Masquer" : "Afficher"}
                                >
                                  {config.visible ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              {/* Required toggle */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleFieldRequired(field.key)}
                                  disabled={!config.visible}
                                  className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    config.required 
                                      ? "bg-destructive/10 text-destructive" 
                                      : "bg-muted text-muted-foreground hover:text-foreground",
                                    !config.visible && "opacity-50 cursor-not-allowed"
                                  )}
                                  title={config.required ? "Optionnel" : "Obligatoire"}
                                >
                                  <Asterisk className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" size="sm">
          Réinitialiser
        </Button>
        <Button size="sm">
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
