import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  Trash2,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useAIProspects, AIProspect } from "@/hooks/useAIProspects";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ProspectTab = "pending" | "converted" | "rejected";

export function AIProspectsManager() {
  const {
    prospects,
    isLoading,
    convertProspect,
    deleteProspect,
    rejectProspect,
  } = useAIProspects();

  const [activeTab, setActiveTab] = useState<ProspectTab>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<AIProspect | null>(null);
  const [createLeadOnConvert, setCreateLeadOnConvert] = useState(true);

  // Filter prospects by status
  const pendingProspects = useMemo(
    () => prospects.filter((p) => p.status === "new" || p.status === "reviewed"),
    [prospects]
  );
  const convertedProspects = useMemo(
    () => prospects.filter((p) => p.status === "converted"),
    [prospects]
  );
  const rejectedProspects = useMemo(
    () => prospects.filter((p) => p.status === "rejected"),
    [prospects]
  );

  const currentProspects = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return pendingProspects;
      case "converted":
        return convertedProspects;
      case "rejected":
        return rejectedProspects;
    }
  }, [activeTab, pendingProspects, convertedProspects, rejectedProspects]);

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

  const handleReject = async (prospect: AIProspect) => {
    await rejectProspect.mutateAsync(prospect.id);
  };

  const handleDelete = async (prospect: AIProspect) => {
    await deleteProspect.mutateAsync(prospect.id);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === currentProspects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentProspects.map((p) => p.id)));
    }
  };

  const getStatusBadge = (status: AIProspect["status"]) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Nouveau
          </Badge>
        );
      case "reviewed":
        return (
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            Examiné
          </Badge>
        );
      case "converted":
        return (
          <Badge className="bg-emerald-500 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Converti
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (prospects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={Target}
            title="Aucun prospect IA"
            description="Utilisez la prospection IA pour trouver de nouveaux leads à contacter."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Tabs for filtering by status */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProspectTab)}>
            <div className="border-b px-4 py-2">
              <TabsList className="h-9 bg-transparent p-0 gap-4">
                <TabsTrigger
                  value="pending"
                  className="h-9 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
                >
                  <span className="flex items-center gap-2">
                    À traiter
                    {pendingProspects.length > 0 && (
                      <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                        {pendingProspects.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="converted"
                  className="h-9 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
                >
                  <span className="flex items-center gap-2">
                    Convertis
                    {convertedProspects.length > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-xs bg-emerald-500">
                        {convertedProspects.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="h-9 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none"
                >
                  <span className="flex items-center gap-2">
                    Rejetés
                    {rejectedProspects.length > 0 && (
                      <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-xs">
                        {rejectedProspects.length}
                      </Badge>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {currentProspects.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Aucun prospect dans cette catégorie
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === currentProspects.length && currentProspects.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProspects.map((prospect) => (
                      <TableRow key={prospect.id} className="group">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(prospect.id)}
                            onCheckedChange={() => toggleSelect(prospect.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{prospect.company_name}</span>
                            </div>
                            {prospect.company_industry && (
                              <Badge variant="secondary" className="text-[10px]">
                                {prospect.company_industry}
                              </Badge>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {prospect.company_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {prospect.company_phone}
                                </span>
                              )}
                              {prospect.company_website && (
                                <a
                                  href={prospect.company_website.startsWith("http") ? prospect.company_website : `https://${prospect.company_website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-primary"
                                >
                                  <Globe className="h-3 w-3" />
                                  Site web
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {prospect.contact_name ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{prospect.contact_name}</span>
                              </div>
                              {prospect.contact_role && (
                                <Badge variant="outline" className="text-[10px]">
                                  {prospect.contact_role}
                                </Badge>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {prospect.contact_email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {prospect.contact_email}
                                  </span>
                                )}
                                {prospect.contact_phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {prospect.contact_phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {prospect.company_city ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              {prospect.company_postal_code} {prospect.company_city}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate text-xs text-muted-foreground" title={prospect.source_query}>
                            {prospect.source_query}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(prospect.created_at), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {activeTab === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => openConvertDialog(prospect)} className="gap-2">
                                    <Check className="h-4 w-4 text-emerald-500" />
                                    Confirmer en contact
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(prospect)} className="gap-2">
                                    <X className="h-4 w-4 text-destructive" />
                                    Rejeter
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDelete(prospect)}
                                className="gap-2 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && activeTab === "pending" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    selectedIds.forEach((id) => {
                      const prospect = currentProspects.find((p) => p.id === id);
                      if (prospect) handleReject(prospect);
                    });
                    setSelectedIds(new Set());
                  }}
                >
                  <X className="h-4 w-4" />
                  Rejeter
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    selectedIds.forEach((id) => {
                      const prospect = currentProspects.find((p) => p.id === id);
                      if (prospect) {
                        convertProspect.mutate({
                          prospect,
                          createLead: true,
                        });
                      }
                    });
                    setSelectedIds(new Set());
                  }}
                >
                  <Check className="h-4 w-4" />
                  Confirmer tous
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le prospect</DialogTitle>
            <DialogDescription>
              Convertir ce prospect en entreprise et contact dans votre CRM.
            </DialogDescription>
          </DialogHeader>

          {selectedProspect && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedProspect.company_name}</span>
                </div>
                {selectedProspect.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      {selectedProspect.contact_name}
                      {selectedProspect.contact_role && ` - ${selectedProspect.contact_role}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Checkbox
                  id="create-lead"
                  checked={createLeadOnConvert}
                  onCheckedChange={(c) => setCreateLeadOnConvert(c === true)}
                />
                <label htmlFor="create-lead" className="text-sm cursor-pointer">
                  <span className="font-medium">Créer également un lead</span>
                  <p className="text-muted-foreground text-xs">
                    Ajouter automatiquement dans votre pipeline de prospection
                  </p>
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
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conversion...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
