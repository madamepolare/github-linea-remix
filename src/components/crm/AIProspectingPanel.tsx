import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X,
  MoreHorizontal,
  ArrowRight,
  Save,
  Trash2,
  ExternalLink,
  Target,
  RefreshCw,
} from "lucide-react";
import { useAIProspects, ProspectSearchResult, ProspectContact, AIProspect } from "@/hooks/useAIProspects";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Directeurs commerciaux et responsables développement chez les promoteurs immobiliers Île-de-France avec emails et téléphones",
  "Architectes associés et directeurs d'agences d'architecture Paris Lyon Marseille, emails LinkedIn",
  "Dirigeants et responsables projets des bureaux d'études structure fluides région parisienne",
  "Responsables achats prescription maîtres d'ouvrage publics Hauts-de-France, coordonnées complètes",
  "Directeurs de programmes et développeurs fonciers promoteurs immobiliers Rhône-Alpes",
];

export function AIProspectingPanel() {
  const {
    prospects,
    isLoading,
    searchProspects,
    saveProspects,
    convertProspect,
    deleteProspect,
    rejectProspect,
  } = useAIProspects();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProspectSearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<AIProspect | null>(null);
  const [createLeadOnConvert, setCreateLeadOnConvert] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await searchProspects.mutateAsync({ query: searchQuery });
      setSearchResults(result.prospects);
      setSelectedResults(new Set(result.prospects.map((_, i) => i)));
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSaveSelected = async () => {
    const selectedProspects = searchResults.filter((_, i) => selectedResults.has(i));
    if (selectedProspects.length === 0) return;

    await saveProspects.mutateAsync({
      prospects: selectedProspects,
      sourceQuery: searchQuery,
    });

    setSearchResults([]);
    setSelectedResults(new Set());
    setActiveTab("saved");
  };

  const toggleResult = (index: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedResults(newSelected);
  };

  const toggleAll = () => {
    if (selectedResults.size === searchResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(searchResults.map((_, i) => i)));
    }
  };

  const openConvertDialog = (prospect: AIProspect) => {
    setSelectedProspect(prospect);
    setConvertDialogOpen(true);
  };

  const handleConvert = async () => {
    if (!selectedProspect) return;

    await convertProspect.mutateAsync({
      prospect: selectedProspect,
      createLead: createLeadOnConvert,
    });

    setConvertDialogOpen(false);
    setSelectedProspect(null);
  };

  const getStatusBadge = (status: AIProspect["status"]) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">Nouveau</Badge>;
      case "reviewed":
        return <Badge variant="outline">Examiné</Badge>;
      case "converted":
        return <Badge className="bg-emerald-500">Converti</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
    }
  };

  const newProspects = prospects.filter((p) => p.status === "new" || p.status === "reviewed");
  const convertedProspects = prospects.filter((p) => p.status === "converted");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "search" | "saved")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Recherche AI
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            <Target className="h-4 w-4" />
            Prospects ({newProspects.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Agent de Prospection AI
              </CardTitle>
              <CardDescription>
                Soyez précis sur les <strong>fonctions</strong> (directeur commercial, gérant...), le <strong>secteur</strong> et la <strong>localisation</strong>. Plus votre demande est détaillée, plus l'IA trouvera de contacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Ex: Directeurs commerciaux et responsables développement chez les promoteurs immobiliers en Île-de-France, avec leurs emails et numéros de téléphone directs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">💡 Exemples de prompts efficaces :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="ghost"
                        size="sm"
                        className="text-xs h-auto py-1 px-2 text-muted-foreground hover:text-foreground whitespace-normal text-left justify-start"
                        onClick={() => setSearchQuery(prompt)}
                      >
                        {prompt.length > 60 ? prompt.substring(0, 60) + "..." : prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

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
                    Lancer la recherche
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-2xl font-bold text-primary">
                        {searchResults.reduce((acc, r) => acc + (r.contacts?.length || 0), 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">contacts</div>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">
                        {searchResults.length}
                      </div>
                      <div className="text-xs text-muted-foreground">entreprises</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={toggleAll}>
                      {selectedResults.size === searchResults.length ? "Désélectionner" : "Tout sélectionner"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSelected}
                      disabled={selectedResults.size === 0 || saveProspects.isPending}
                    >
                      {saveProspects.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Enregistrer ({selectedResults.size})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          "rounded-lg border transition-colors",
                          selectedResults.has(index)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {/* Company Header */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => toggleResult(index)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedResults.has(index)}
                              onCheckedChange={() => toggleResult(index)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Company info */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Building2 className="h-4 w-4 text-primary shrink-0" />
                                <span className="font-semibold text-base">{result.company_name}</span>
                                {result.company_industry && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {result.company_industry}
                                  </Badge>
                                )}
                                {result.confidence_score && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Confiance: {Math.round(result.confidence_score * 100)}%
                                  </Badge>
                                )}
                              </div>

                              {/* Company details grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                                {result.company_city && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span>{result.company_postal_code} {result.company_city}</span>
                                  </div>
                                )}
                                {result.company_phone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                    <span>{result.company_phone}</span>
                                  </div>
                                )}
                                {result.company_email && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{result.company_email}</span>
                                  </div>
                                )}
                                {result.company_website && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Globe className="h-3.5 w-3.5 shrink-0" />
                                    <a
                                      href={result.company_website.startsWith("http") ? result.company_website : `https://${result.company_website}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {result.company_website}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Contacts section */}
                              {result.contacts && result.contacts.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      {result.contacts.length} contact{result.contacts.length > 1 ? "s" : ""} trouvé{result.contacts.length > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {result.contacts.map((contact, cIdx) => (
                                      <div 
                                        key={cIdx}
                                        className="p-2.5 rounded-md bg-muted/30 border border-border/50 space-y-1"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{contact.name}</span>
                                          {contact.role && (
                                            <Badge variant="outline" className="text-[10px] h-5">
                                              {contact.role}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                          {contact.email && (
                                            <div className="flex items-center gap-1">
                                              <Mail className="h-3 w-3" />
                                              <span>{contact.email}</span>
                                            </div>
                                          )}
                                          {contact.phone && (
                                            <div className="flex items-center gap-1">
                                              <Phone className="h-3 w-3" />
                                              <span>{contact.phone}</span>
                                            </div>
                                          )}
                                          {contact.linkedin && (
                                            <a
                                              href={contact.linkedin}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 hover:text-primary"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              <span>LinkedIn</span>
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Notes */}
                              {result.notes && (
                                <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-2">
                                  💡 {result.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {searchProspects.isSuccess && searchResults.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun prospect trouvé pour cette recherche.</p>
                <p className="text-sm mt-1">Essayez avec des termes différents.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Saved Prospects Tab */}
        <TabsContent value="saved" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : newProspects.length === 0 && convertedProspects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun prospect enregistré</p>
                <p className="text-sm mt-1">
                  Utilisez l'onglet "Recherche AI" pour trouver de nouveaux prospects.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* New prospects */}
              {newProspects.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Prospects à traiter ({newProspects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entreprise</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Coordonnées</TableHead>
                            <TableHead>Requête</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newProspects.map((prospect) => (
                            <TableRow key={prospect.id}>
                              <TableCell>
                                <div className="font-medium">{prospect.company_name}</div>
                                {prospect.company_city && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {prospect.company_city}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {prospect.contact_name ? (
                                  <div>
                                    <div className="text-sm">{prospect.contact_name}</div>
                                    {prospect.contact_role && (
                                      <div className="text-xs text-muted-foreground">
                                        {prospect.contact_role}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {(prospect.contact_email || prospect.company_email) && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Mail className="h-3 w-3" />
                                      {prospect.contact_email || prospect.company_email}
                                    </div>
                                  )}
                                  {(prospect.contact_phone || prospect.company_phone) && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Phone className="h-3 w-3" />
                                      {prospect.contact_phone || prospect.company_phone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {prospect.source_query}
                                </span>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openConvertDialog(prospect)}>
                                      <ArrowRight className="h-4 w-4 mr-2" />
                                      Convertir en contact
                                    </DropdownMenuItem>
                                    {prospect.company_website && (
                                      <DropdownMenuItem asChild>
                                        <a
                                          href={prospect.company_website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Voir le site
                                        </a>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => rejectProspect.mutate(prospect.id)}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Rejeter
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => deleteProspect.mutate(prospect.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Converted prospects */}
              {convertedProspects.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      Prospects convertis ({convertedProspects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entreprise</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Date conversion</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {convertedProspects.map((prospect) => (
                            <TableRow key={prospect.id} className="opacity-70">
                              <TableCell className="font-medium">
                                {prospect.company_name}
                              </TableCell>
                              <TableCell>{prospect.contact_name || "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(prospect.updated_at).toLocaleDateString("fr-FR")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convertir le prospect</DialogTitle>
            <DialogDescription>
              Ce prospect va être converti en entreprise et contact dans votre CRM.
            </DialogDescription>
          </DialogHeader>

          {selectedProspect && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedProspect.company_name}</span>
                </div>
                {selectedProspect.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{selectedProspect.contact_name}</span>
                    {selectedProspect.contact_role && (
                      <span className="text-xs">({selectedProspect.contact_role})</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Checkbox
                  id="create-lead"
                  checked={createLeadOnConvert}
                  onCheckedChange={(checked) => setCreateLeadOnConvert(!!checked)}
                />
                <label htmlFor="create-lead" className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">Créer une opportunité</div>
                  <div className="text-xs text-muted-foreground">
                    Une opportunité sera créée en plus de l'entreprise et du contact
                  </div>
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleConvert} disabled={convertProspect.isPending}>
              {convertProspect.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Convertir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
