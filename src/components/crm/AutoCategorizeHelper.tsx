import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Building2, 
  Users, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  ChevronRight,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoCategorize, FilterMode, EntityType } from "@/hooks/useAutoCategorize";
import { useCRMSettings } from "@/hooks/useCRMSettings";

export function AutoCategorizeHelper() {
  const [open, setOpen] = useState(false);
  
  const {
    isAnalyzing,
    suggestions,
    filterMode,
    entityType,
    stats,
    uncategorizedCompanies,
    uncategorizedContacts,
    setFilterMode,
    setEntityType,
    analyzeEntities,
    toggleSelection,
    selectAll,
    applySuggestions,
    isApplying,
    clearSuggestions,
  } = useAutoCategorize();

  const { getCompanyCategoryLabel, getCompanyTypeLabel, getContactTypeLabel } = useCRMSettings();

  const selectedCount = suggestions.filter(s => s.selected).length;
  const entitiesToShow = entityType === "companies" ? uncategorizedCompanies : uncategorizedContacts;

  const filterOptions: { value: FilterMode; label: string }[] = [
    { value: "uncategorized", label: "Sans catégorie" },
    { value: "unknown", label: "Catégorie inconnue" },
    { value: "all", label: "Toutes" },
  ];

  const handleClose = () => {
    setOpen(false);
    clearSuggestions();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Auto-catégoriser</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Auto-catégorisation IA
          </SheetTitle>
          <SheetDescription>
            Analysez et catégorisez automatiquement vos entreprises et contacts
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
          {/* Entity type tabs */}
          <Tabs 
            value={entityType} 
            onValueChange={(v) => {
              setEntityType(v as EntityType);
              clearSuggestions();
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="companies" className="gap-2">
                <Building2 className="h-4 w-4" />
                Entreprises
                {stats.companies.uncategorized > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.companies.uncategorized}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <Users className="h-4 w-4" />
                Contacts
                {stats.contacts.uncategorized > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.contacts.uncategorized}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Stats section */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {entityType === "companies" ? (
                <>
                  <StatCard 
                    label="Total" 
                    value={stats.companies.total} 
                    variant="default"
                  />
                  <StatCard 
                    label="Sans catégorie" 
                    value={stats.companies.uncategorized} 
                    variant="warning"
                  />
                  <StatCard 
                    label="Type inconnu" 
                    value={stats.companies.unknownType} 
                    variant="error"
                  />
                </>
              ) : (
                <>
                  <StatCard 
                    label="Total" 
                    value={stats.contacts.total} 
                    variant="default"
                  />
                  <StatCard 
                    label="Sans type" 
                    value={stats.contacts.uncategorized} 
                    variant="warning"
                  />
                  <StatCard 
                    label="Type inconnu" 
                    value={stats.contacts.unknownType} 
                    variant="error"
                  />
                </>
              )}
            </div>

            {/* Filter options */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtrer:</span>
              {filterOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={filterMode === opt.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setFilterMode(opt.value);
                    clearSuggestions();
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 mt-4 overflow-hidden">
              {suggestions.length === 0 ? (
                // Show entities to analyze
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {entitiesToShow.length} {entityType === "companies" ? "entreprise(s)" : "contact(s)"} à analyser
                      {entitiesToShow.length > 20 && " (20 max par analyse)"}
                    </p>
                    <Button 
                      onClick={() => analyzeEntities()}
                      disabled={isAnalyzing || entitiesToShow.length === 0}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyser avec l'IA
                        </>
                      )}
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {entitiesToShow.slice(0, 20).map((entity) => (
                        <div 
                          key={entity.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                        >
                          {entityType === "companies" ? (
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entity.name}</p>
                            {entityType === "companies" && (entity as any).industry && (
                              <p className="text-xs text-muted-foreground">
                                Actuel: {getCompanyTypeLabel((entity as any).industry) || (entity as any).industry}
                              </p>
                            )}
                            {entityType === "contacts" && (entity as any).contact_type && (
                              <p className="text-xs text-muted-foreground">
                                Actuel: {getContactTypeLabel((entity as any).contact_type) || (entity as any).contact_type}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                      {entitiesToShow.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
                          <p>Tout est catégorisé !</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                // Show suggestions
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedCount === suggestions.length && suggestions.length > 0}
                        onCheckedChange={(checked) => selectAll(!!checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedCount}/{suggestions.length} sélectionné(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearSuggestions}
                      >
                        Nouvelle analyse
                      </Button>
                      <Button
                        onClick={() => applySuggestions()}
                        disabled={isApplying || selectedCount === 0}
                      >
                        {isApplying ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Application...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Appliquer ({selectedCount})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[350px] border rounded-lg">
                    <div className="p-2 space-y-2">
                      {suggestions.map((suggestion) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          entityType={entityType}
                          onToggle={() => toggleSelection(suggestion.id)}
                          getCompanyCategoryLabel={getCompanyCategoryLabel}
                          getCompanyTypeLabel={getCompanyTypeLabel}
                          getContactTypeLabel={getContactTypeLabel}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Stat card component
function StatCard({ 
  label, 
  value, 
  variant 
}: { 
  label: string; 
  value: number; 
  variant: "default" | "warning" | "error" 
}) {
  return (
    <div className={cn(
      "p-3 rounded-lg border text-center",
      variant === "warning" && "bg-warning/10 border-warning/30",
      variant === "error" && "bg-destructive/10 border-destructive/30",
      variant === "default" && "bg-muted/50"
    )}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// Suggestion card component
function SuggestionCard({
  suggestion,
  entityType,
  onToggle,
  getCompanyCategoryLabel,
  getCompanyTypeLabel,
  getContactTypeLabel,
}: {
  suggestion: any;
  entityType: EntityType;
  onToggle: () => void;
  getCompanyCategoryLabel: (key: string) => string;
  getCompanyTypeLabel: (key: string) => string;
  getContactTypeLabel: (key: string) => string;
}) {
  const confidenceColor = suggestion.confidence >= 80 
    ? "text-success" 
    : suggestion.confidence >= 60 
      ? "text-warning" 
      : "text-destructive";

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        suggestion.selected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={suggestion.selected} 
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium truncate">{suggestion.name}</p>
            <Badge variant="outline" className={cn("shrink-0", confidenceColor)}>
              {suggestion.confidence}%
            </Badge>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {entityType === "companies" && (
              <>
                {suggestion.suggested_category && (
                  <Badge variant="secondary">
                    {getCompanyCategoryLabel(suggestion.suggested_category) || suggestion.suggested_category_label}
                  </Badge>
                )}
                {suggestion.suggested_type && (
                  <Badge>
                    {getCompanyTypeLabel(suggestion.suggested_type) || suggestion.suggested_type_label}
                  </Badge>
                )}
                {suggestion.suggested_bet_specialties?.map((spec: string) => (
                  <Badge key={spec} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </>
            )}
            {entityType === "contacts" && suggestion.suggested_type && (
              <Badge>
                {getContactTypeLabel(suggestion.suggested_type) || suggestion.suggested_type_label}
              </Badge>
            )}
          </div>
          
          <p className="mt-2 text-xs text-muted-foreground">
            {suggestion.reason}
          </p>
        </div>
      </div>
    </div>
  );
}
