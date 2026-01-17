import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject, useProjects } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectTeam } from "@/hooks/useProjectTeam";
import { useProjectContacts } from "@/hooks/useProjectContacts";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectTypeSettings, getProjectTypeIcon } from "@/hooks/useProjectTypeSettings";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  Layers,
  Users,
  Building2,
  FolderKanban,
  Home,
  Archive,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// Disciplines that show surface field
const SURFACE_TYPES = ["architecture", "interior", "interieur", "archi"];

const colors = [
  { value: "#3B82F6", label: "Bleu" },
  { value: "#10B981", label: "Vert" },
  { value: "#F59E0B", label: "Ambre" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EF4444", label: "Rouge" },
  { value: "#EC4899", label: "Rose" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#000000", label: "Noir" },
];

// Helper to get icon component from name
const getIconComponent = (iconName: string): React.ElementType => {
  const icons = LucideIcons as unknown as Record<string, React.ElementType>;
  return icons[iconName] || FolderKanban;
};

function shouldShowSurface(projectType: string | null): boolean {
  if (!projectType) return false;
  return SURFACE_TYPES.some(t => 
    projectType.toLowerCase().includes(t.toLowerCase())
  );
}

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id || null);
  const { updateProject, archiveProject, deleteProject } = useProjects();
  const { phases } = useProjectPhases(id || null);
  const { members } = useProjectTeam(id || null);
  const { contacts } = useProjectContacts(id || null);
  const { companies } = useCRMCompanies();
  const { projectTypes, isLoading: typesLoading } = useProjectTypeSettings();

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<string | null>(null);
  const [color, setColor] = useState("#3B82F6");
  const [isInternal, setIsInternal] = useState(false);
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Sync form state when project loads
  useState(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setProjectType(project.project_type);
      setColor(project.color || "#3B82F6");
      setIsInternal(project.is_internal || false);
      setCrmCompanyId(project.crm_company_id);
      setAddress(project.address || "");
      setCity(project.city || "");
      setPostalCode(project.postal_code || "");
      setSurfaceArea(project.surface_area?.toString() || "");
      setBudget(project.budget?.toString() || "");
      setStartDate(project.start_date ? parseISO(project.start_date) : null);
      setEndDate(project.end_date ? parseISO(project.end_date) : null);
    }
  });

  // Re-sync when project changes
  if (project && name === "" && project.name) {
    setName(project.name);
    setDescription(project.description || "");
    setProjectType(project.project_type);
    setColor(project.color || "#3B82F6");
    setIsInternal(project.is_internal || false);
    setCrmCompanyId(project.crm_company_id);
    setAddress(project.address || "");
    setCity(project.city || "");
    setPostalCode(project.postal_code || "");
    setSurfaceArea(project.surface_area?.toString() || "");
    setBudget(project.budget?.toString() || "");
    setStartDate(project.start_date ? parseISO(project.start_date) : null);
    setEndDate(project.end_date ? parseISO(project.end_date) : null);
  }

  const showSurface = shouldShowSurface(projectType);

  const clientCompanies = companies.filter(c => 
    c.industry === "client_particulier" || 
    c.industry === "client_professionnel" || 
    c.industry === "promoteur" || 
    c.industry === "investisseur" ||
    !c.industry
  );

  const handleSave = async () => {
    if (!id || !name.trim()) return;
    
    setIsSaving(true);
    try {
      await updateProject.mutateAsync({
        id,
        name: name.trim(),
        description: description.trim() || null,
        project_type: projectType as any,
        color,
        is_internal: isInternal,
        crm_company_id: isInternal ? null : crmCompanyId,
        address: isInternal ? null : (address.trim() || null),
        city: isInternal ? null : (city.trim() || null),
        postal_code: isInternal ? null : (postalCode.trim() || null),
        surface_area: showSurface && surfaceArea ? parseFloat(surfaceArea) : null,
        budget: isInternal ? null : (budget ? parseFloat(budget) : null),
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      });
      toast.success("Projet mis à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    await archiveProject.mutateAsync({ id, isArchived: true });
    navigate("/projects");
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.")) return;
    await deleteProject.mutateAsync(id);
    navigate("/projects");
  };

  if (projectLoading || !project) {
    return (
      <PageLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Paramètres projet">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Paramètres du projet</h1>
              <p className="text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              Général
            </TabsTrigger>
            <TabsTrigger value="phases" className="gap-2">
              <Layers className="h-4 w-4" />
              Phases
              <Badge variant="secondary" className="ml-1">{phases?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Équipe
              <Badge variant="secondary" className="ml-1">{members?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <Building2 className="h-4 w-4" />
              Client
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>Configurez les informations de base du projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Internal Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-base">Projet interne</Label>
                      <p className="text-sm text-muted-foreground">Non facturable (admin, R&D...)</p>
                    </div>
                  </div>
                  <Switch checked={isInternal} onCheckedChange={setIsInternal} />
                </div>

                {/* Project Type */}
                <div className="space-y-3">
                  <Label>Type de projet</Label>
                  {typesLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {projectTypes.map((type) => {
                        const iconName = type.icon || getProjectTypeIcon(type.key);
                        const Icon = getIconComponent(iconName);
                        return (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() => setProjectType(type.key)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                              projectType === type.key
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div 
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                projectType === type.key ? "bg-primary text-primary-foreground" : "bg-muted"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Name & Color */}
                <div className="grid grid-cols-[1fr,auto] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du projet *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nom du projet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <div className="flex gap-1.5 flex-wrap max-w-[140px]">
                      {colors.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setColor(c.value)}
                          className={cn(
                            "w-6 h-6 rounded-full transition-all",
                            color === c.value && "ring-2 ring-offset-2 ring-primary"
                          )}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes sur le projet..."
                    rows={4}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <InlineDatePicker value={startDate} onChange={setStartDate} placeholder="Sélectionner..." className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <InlineDatePicker value={endDate} onChange={setEndDate} placeholder="Sélectionner..." className="w-full" />
                  </div>
                </div>

                {/* Location & Details - only for external projects */}
                {!isInternal && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <Label className="text-base">Localisation & Détails</Label>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 rue de Paris" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Code postal</Label>
                          <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75001" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ville</Label>
                          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" />
                        </div>
                      </div>

                      <div className={cn("grid gap-4", showSurface ? "grid-cols-2" : "grid-cols-1")}>
                        {showSurface && (
                          <div className="space-y-2">
                            <Label htmlFor="surface">Surface (m²)</Label>
                            <Input id="surface" type="number" value={surfaceArea} onChange={(e) => setSurfaceArea(e.target.value)} placeholder="150" />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget (€)</Label>
                          <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="50000" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Zone de danger
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Archiver le projet</p>
                    <p className="text-sm text-muted-foreground">Le projet sera masqué mais conservé</p>
                  </div>
                  <Button variant="outline" onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archiver
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30">
                  <div>
                    <p className="font-medium text-destructive">Supprimer le projet</p>
                    <p className="text-sm text-muted-foreground">Action irréversible</p>
                  </div>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Phases du projet</CardTitle>
                <CardDescription>Gérez les phases et jalons du projet</CardDescription>
              </CardHeader>
              <CardContent>
                {phases && phases.length > 0 ? (
                  <div className="space-y-2">
                    {phases.map((phase, index) => (
                      <div key={phase.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{phase.name}</p>
                          {phase.description && <p className="text-sm text-muted-foreground">{phase.description}</p>}
                        </div>
                        <Badge variant={phase.status === "completed" ? "default" : "secondary"}>
                          {phase.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Aucune phase configurée</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Équipe projet</CardTitle>
                <CardDescription>Membres internes et collaborateurs externes</CardDescription>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{member.profile?.full_name || "Membre"}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">Aucun membre dans l'équipe</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Tab */}
          <TabsContent value="client" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
                <CardDescription>Entreprise et contacts client associés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isInternal ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="font-medium">Projet interne</p>
                    <p className="text-sm text-muted-foreground">Pas de client associé</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Entreprise client</Label>
                      <Select value={crmCompanyId || "none"} onValueChange={(v) => setCrmCompanyId(v === "none" ? null : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun client</SelectItem>
                          {clientCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {contacts && contacts.length > 0 && (
                      <div className="space-y-2">
                        <Label>Contacts client</Label>
                        <div className="space-y-2">
                          {contacts.map((contact) => (
                            <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg border">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{contact.contact?.first_name} {contact.contact?.last_name}</p>
                                <p className="text-sm text-muted-foreground">{contact.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
