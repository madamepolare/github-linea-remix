import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Search,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Loader2,
  Check,
  ArrowRight,
  Target,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";
import { useAIProspects, ProspectSearchResult, ProspectContact } from "@/hooks/useAIProspects";
import { useCRMPipelines, Pipeline, PipelineStage } from "@/hooks/useCRMPipelines";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EXAMPLE_PROMPTS = [
  "Directeurs commerciaux promoteurs immobiliers Île-de-France",
  "Architectes associés agences Paris Lyon Marseille",
  "Responsables projets bureaux d'études structure",
  "Responsables achats maîtres d'ouvrage publics",
  "Directeurs de programmes promoteurs Rhône-Alpes",
];

interface SelectedProspectForConversion {
  result: ProspectSearchResult;
  contacts: Set<number>; // indices of selected contacts
}

export function AIProspectingPanel() {
  const {
    searchProspects,
    saveAndConvertProspects,
  } = useAIProspects();

  const { opportunityPipelines } = useCRMPipelines();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProspectSearchResult[]>([]);
  const [selectedForConversion, setSelectedForConversion] = useState<Map<number, SelectedProspectForConversion>>(new Map());
  const [searchProvider, setSearchProvider] = useState<"openai" | "firecrawl">("openai");
  
  // Conversion dialog
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [createLeads, setCreateLeads] = useState(true);
  const [isConverting, setIsConverting] = useState(false);

  // Get default pipeline
  const defaultPipeline = opportunityPipelines.find(p => p.is_default) || opportunityPipelines[0];
  const selectedPipeline = opportunityPipelines.find(p => p.id === selectedPipelineId);
  const availableStages = selectedPipeline?.stages || [];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await searchProspects.mutateAsync({ 
        query: searchQuery,
        provider: searchProvider 
      });
      setSearchResults(result.prospects);
      setSelectedForConversion(new Map());
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Erreur lors de la recherche");
    }
  };

  const toggleCompanySelection = (index: number) => {
    const newSelection = new Map(selectedForConversion);
    
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      const result = searchResults[index];
      // Select all contacts by default
      const allContactIndices = new Set(result.contacts?.map((_, i) => i) || []);
      newSelection.set(index, {
        result,
        contacts: allContactIndices,
      });
    }
    
    setSelectedForConversion(newSelection);
  };

  const toggleContactSelection = (companyIndex: number, contactIndex: number) => {
    const newSelection = new Map(selectedForConversion);
    const current = newSelection.get(companyIndex);
    
    if (!current) return;
    
    const newContacts = new Set(current.contacts);
    if (newContacts.has(contactIndex)) {
      newContacts.delete(contactIndex);
    } else {
      newContacts.add(contactIndex);
    }
    
    newSelection.set(companyIndex, { ...current, contacts: newContacts });
    setSelectedForConversion(newSelection);
  };

  const selectAll = () => {
    if (selectedForConversion.size === searchResults.length) {
      setSelectedForConversion(new Map());
    } else {
      const newSelection = new Map<number, SelectedProspectForConversion>();
      searchResults.forEach((result, index) => {
        const allContactIndices = new Set(result.contacts?.map((_, i) => i) || []);
        newSelection.set(index, { result, contacts: allContactIndices });
      });
      setSelectedForConversion(newSelection);
    }
  };

  const openConversionDialog = () => {
    if (selectedForConversion.size === 0) {
      toast.error("Sélectionnez au moins une entreprise");
      return;
    }
    
    // Set defaults
    if (defaultPipeline) {
      setSelectedPipelineId(defaultPipeline.id);
      const firstStage = defaultPipeline.stages?.[0];
      if (firstStage) {
        setSelectedStageId(firstStage.id);
      }
    }
    
    setShowConvertDialog(true);
  };

  const handleConvert = async () => {
    if (selectedForConversion.size === 0) return;
    
    setIsConverting(true);
    
    try {
      // Prepare prospects for conversion
      const prospectsToConvert: Array<{
        company: ProspectSearchResult;
        selectedContacts: ProspectContact[];
      }> = [];

      selectedForConversion.forEach(({ result, contacts }) => {
        const selectedContacts = result.contacts?.filter((_, i) => contacts.has(i)) || [];
        prospectsToConvert.push({
          company: result,
          selectedContacts,
        });
      });

      await saveAndConvertProspects.mutateAsync({
        prospects: prospectsToConvert,
        sourceQuery: searchQuery,
        createLeads,
        pipelineId: selectedPipelineId || undefined,
        stageId: selectedStageId || undefined,
      });

      // Clear selection and close dialog
      setSelectedForConversion(new Map());
      setShowConvertDialog(false);
      setSearchResults([]);
      
      const totalContacts = prospectsToConvert.reduce((acc, p) => acc + p.selectedContacts.length, 0);
      toast.success(
        `${prospectsToConvert.length} entreprise(s) et ${totalContacts} contact(s) ajoutés au CRM`
      );
    } catch (error) {
      console.error("Conversion failed:", error);
      toast.error("Erreur lors de la conversion");
    } finally {
      setIsConverting(false);
    }
  };

  const totalSelectedContacts = Array.from(selectedForConversion.values())
    .reduce((acc, s) => acc + s.contacts.size, 0);

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Recherche IA de prospects</CardTitle>
              <CardDescription className="text-sm">
                Décrivez les profils recherchés : fonction, secteur, localisation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Ex: Directeurs commerciaux et responsables développement chez les promoteurs immobiliers en Île-de-France..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Provider selector */}
            <Select value={searchProvider} onValueChange={(v) => setSearchProvider(v as "openai" | "firecrawl")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    OpenAI + Perplexity
                  </div>
                </SelectItem>
                <SelectItem value="firecrawl">
                  <div className="flex items-center gap-2">
                    <span>🔥</span>
                    Firecrawl
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchProspects.isPending}
              className="w-full sm:w-auto"
            >
              {searchProspects.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">{searchResults.length}</span>
                  <span className="text-xs text-muted-foreground">entreprises</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{searchResults.reduce((acc, r) => acc + (r.contacts?.length || 0), 0)}</span>
                  <span className="text-xs text-muted-foreground">contacts</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedForConversion.size === searchResults.length ? "Désélectionner tout" : "Tout sélectionner"}
                </Button>
                <Button
                  size="sm"
                  onClick={openConversionDialog}
                  disabled={selectedForConversion.size === 0}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Ajouter au CRM ({selectedForConversion.size})
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {searchResults.map((result, index) => {
                  const isSelected = selectedForConversion.has(index);
                  const selection = selectedForConversion.get(index);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-4 transition-colors",
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      {/* Company Header */}
                      <div 
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => toggleCompanySelection(index)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCompanySelection(index)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Company info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold">{result.company_name}</span>
                            {result.company_industry && (
                              <Badge variant="secondary" className="text-[10px]">
                                {result.company_industry}
                              </Badge>
                            )}
                            {result.confidence_score && result.confidence_score >= 0.8 && (
                              <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                                <TrendingUp className="h-3 w-3" />
                                Haute qualité
                              </Badge>
                            )}
                          </div>

                          {/* Company details */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {result.company_city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {result.company_postal_code} {result.company_city}
                              </span>
                            )}
                            {result.company_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {result.company_phone}
                              </span>
                            )}
                            {result.company_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {result.company_email}
                              </span>
                            )}
                            {result.company_website && (
                              <a
                                href={result.company_website.startsWith("http") ? result.company_website : `https://${result.company_website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="h-3.5 w-3.5" />
                                Site web
                              </a>
                            )}
                          </div>

                          {/* Contacts */}
                          {result.contacts && result.contacts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  {result.contacts.length} contact{result.contacts.length > 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {result.contacts.map((contact, cIdx) => {
                                  const isContactSelected = isSelected && selection?.contacts.has(cIdx);
                                  
                                  return (
                                    <div 
                                      key={cIdx}
                                      className={cn(
                                        "p-2.5 rounded-md border space-y-1 cursor-pointer transition-colors",
                                        isContactSelected 
                                          ? "bg-primary/10 border-primary/30" 
                                          : "bg-muted/30 border-border/50 hover:border-border"
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSelected) {
                                          toggleContactSelection(index, cIdx);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isSelected && (
                                          <Checkbox
                                            checked={isContactSelected}
                                            onCheckedChange={() => toggleContactSelection(index, cIdx)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-3.5 w-3.5"
                                          />
                                        )}
                                        <span className="font-medium text-sm">{contact.name}</span>
                                        {contact.role && (
                                          <Badge variant="outline" className="text-[10px] h-5">
                                            {contact.role}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                        {contact.email && (
                                          <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" />
                                            {contact.email}
                                          </span>
                                        )}
                                        {contact.phone && (
                                          <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {contact.phone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty state after search */}
      {searchProspects.isSuccess && searchResults.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun prospect trouvé pour cette recherche.</p>
            <p className="text-sm mt-1">Essayez avec des termes différents.</p>
          </CardContent>
        </Card>
      )}

      {/* Conversion Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Ajouter au CRM
            </DialogTitle>
            <DialogDescription>
              {selectedForConversion.size} entreprise(s) et {totalSelectedContacts} contact(s) sélectionné(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedForConversion.size} entreprises</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{totalSelectedContacts} contacts</span>
              </div>
            </div>

            {/* Create leads option */}
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Checkbox
                id="create-leads"
                checked={createLeads}
                onCheckedChange={(checked) => setCreateLeads(!!checked)}
              />
              <label htmlFor="create-leads" className="flex-1 cursor-pointer">
                <div className="font-medium text-sm">Créer des opportunités</div>
                <div className="text-xs text-muted-foreground">
                  Une opportunité sera créée pour chaque entreprise
                </div>
              </label>
            </div>

            {/* Pipeline selection */}
            {createLeads && opportunityPipelines.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm">Pipeline</Label>
                  <Select
                    value={selectedPipelineId}
                    onValueChange={(value) => {
                      setSelectedPipelineId(value);
                      const pipeline = opportunityPipelines.find(p => p.id === value);
                      const firstStage = pipeline?.stages?.[0];
                      if (firstStage) {
                        setSelectedStageId(firstStage.id);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunityPipelines.map((pipeline) => (
                        <SelectItem key={pipeline.id} value={pipeline.id}>
                          <div className="flex items-center gap-2">
                            {pipeline.color && (
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: pipeline.color }}
                              />
                            )}
                            {pipeline.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {availableStages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Étape initiale</Label>
                    <Select
                      value={selectedStageId}
                      onValueChange={setSelectedStageId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une étape" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center gap-2">
                              {stage.color && (
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: stage.color }}
                                />
                              )}
                              {stage.name}
                              {stage.probability !== null && (
                                <span className="text-xs text-muted-foreground">
                                  ({stage.probability}%)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleConvert} disabled={isConverting}>
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Ajouter au CRM
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
