import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProject, useProjects } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectTeam, INTERNAL_ROLES, EXTERNAL_ROLES } from "@/hooks/useProjectTeam";
import { useProjectContacts, CLIENT_TEAM_ROLES } from "@/hooks/useProjectContacts";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjectTypeSettings, getProjectTypeIcon } from "@/hooks/useProjectTypeSettings";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { ProjectContactsManager } from "@/components/projects/ProjectContactsManager";
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
  Star,
  Plus,
  RefreshCw,
  MapPin,
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

const getInitials = (name: string | null) => {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id || null);
  const { updateProject, archiveProject, deleteProject } = useProjects();
  const { phases } = useProjectPhases(id || null);
  const { members, internalMembers, externalMembers, leadMember, getRoleLabel } = useProjectTeam(id || null);
  const { contacts } = useProjectContacts(id || null);
  const { companies } = useCRMCompanies();
  const { projectTypes, isLoading: typesLoading } = useProjectTypeSettings();

  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<string | null>(null);
  const [color, setColor] = useState("#3B82F6");
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState<"active" | "closed">("active");
  const [crmCompanyId, setCrmCompanyId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [surfaceArea, setSurfaceArea] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Sync form state when project loads
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setProjectType(project.project_type);
      setColor(project.color || "#3B82F6");
      setIsInternal(project.is_internal || false);
      setStatus(project.status === "closed" ? "closed" : "active");
      setCrmCompanyId(project.crm_company_id);
      setAddress(project.address || "");
      setCity(project.city || "");
      setPostalCode(project.postal_code || "");
      setSurfaceArea(project.surface_area?.toString() || "");
      setBudget(project.budget?.toString() || "");
      setStartDate(project.start_date ? parseISO(project.start_date) : null);
      setEndDate(project.end_date ? parseISO(project.end_date) : null);
      setHasChanges(false);
    }
  }, [project]);

  // Track changes
  useEffect(() => {
    if (project) {
      const changed = 
        name !== project.name ||
        description !== (project.description || "") ||
        projectType !== project.project_type ||
        color !== (project.color || "#3B82F6") ||
        isInternal !== (project.is_internal || false) ||
        status !== (project.status === "closed" ? "closed" : "active") ||
        crmCompanyId !== project.crm_company_id ||
        address !== (project.address || "") ||
        city !== (project.city || "") ||
        postalCode !== (project.postal_code || "") ||
        surfaceArea !== (project.surface_area?.toString() || "") ||
        budget !== (project.budget?.toString() || "") ||
        (startDate?.toISOString() || null) !== (project.start_date || null) ||
        (endDate?.toISOString() || null) !== (project.end_date || null);
      setHasChanges(changed);
    }
  }, [name, description, projectType, color, isInternal, status, crmCompanyId, address, city, postalCode, surfaceArea, budget, startDate, endDate, project]);

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
        status,
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
      setHasChanges(false);
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
          <Button onClick={handleSave} disabled={isSaving || !name.trim() || !hasChanges}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-b border-border w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              Général
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
            <TabsTrigger value="phases" className="gap-2">
              <Layers className="h-4 w-4" />
              Phases
              <Badge variant="secondary" className="ml-1">{phases?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Paramètres de base du projet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Internal Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Projet interne</Label>
                      <p className="text-xs text-muted-foreground">Non facturable</p>
                    </div>
                  </div>
                  <Switch checked={isInternal} onCheckedChange={setIsInternal} />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("active")}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                        status === "active"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      Ouvert
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("closed")}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                        status === "closed"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      Fermé
                    </button>
                  </div>
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
              </CardContent>
            </Card>

            {/* Planning Card */}
            <Card>
              <CardHeader>
                <CardTitle>Planification</CardTitle>
                <CardDescription>Dates du projet</CardDescription>
              </CardHeader>
              <CardContent>
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

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6 mt-6">
            {/* Internal Team */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Équipe interne</CardTitle>
                    <CardDescription>Membres de l'agence sur ce projet</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}`)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Gérer l'équipe
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {internalMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aucun membre interne</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {internalMembers.map((member) => (
                      <div 
                        key={member.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          member.role === "lead" && "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(member.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {member.profile?.full_name || "Utilisateur"}
                            </p>
                            {member.role === "lead" && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getRoleLabel(member.role, false)}
                          </p>
                        </div>
                        <Badge variant="outline">{getRoleLabel(member.role, false)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Collaborators */}
            <Card>
              <CardHeader>
                <CardTitle>Collaborateurs externes</CardTitle>
                <CardDescription>Freelances, sous-traitants, partenaires</CardDescription>
              </CardHeader>
              <CardContent>
                {externalMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aucun collaborateur externe</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {externalMembers.map((member) => (
                      <div 
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.contact?.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(member.contact?.name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.contact?.name || "Contact"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.contact?.email}
                          </p>
                        </div>
                        <Badge variant="secondary">{getRoleLabel(member.role, true)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Tab */}
          <TabsContent value="client" className="space-y-6 mt-6">
            {isInternal ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Projet interne</p>
                    <p className="text-sm">Pas de client associé à ce projet</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Client Company */}
                <Card>
                  <CardHeader>
                    <CardTitle>Entreprise cliente</CardTitle>
                    <CardDescription>Client principal du projet</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select 
                        value={crmCompanyId || ""} 
                        onValueChange={(v) => setCrmCompanyId(v || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucun client</SelectItem>
                          {clientCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {company.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contacts projet</CardTitle>
                    <CardDescription>Interlocuteurs côté client</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProjectContactsManager 
                      projectId={id!} 
                      companyId={crmCompanyId}
                    />
                  </CardContent>
                </Card>

                {/* Location & Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Localisation & Détails</CardTitle>
                    <CardDescription>Informations du chantier ou lieu d'intervention</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        <MapPin className="h-3.5 w-3.5 inline mr-1" />
                        Adresse
                      </Label>
                      <Input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="123 rue de Paris" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Code postal</Label>
                        <Input 
                          value={postalCode} 
                          onChange={(e) => setPostalCode(e.target.value)} 
                          placeholder="75001" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input 
                          value={city} 
                          onChange={(e) => setCity(e.target.value)} 
                          placeholder="Paris" 
                        />
                      </div>
                    </div>

                    <div className={cn("grid gap-4", showSurface ? "grid-cols-2" : "grid-cols-1")}>
                      {showSurface && (
                        <div className="space-y-2">
                          <Label>Surface (m²)</Label>
                          <Input 
                            type="number" 
                            value={surfaceArea} 
                            onChange={(e) => setSurfaceArea(e.target.value)} 
                            placeholder="150" 
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Budget (€)</Label>
                        <Input 
                          type="number" 
                          value={budget} 
                          onChange={(e) => setBudget(e.target.value)} 
                          placeholder="50000" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Phases Tab */}
          <TabsContent value="phases" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Phases du projet</CardTitle>
                    <CardDescription>Étapes de réalisation</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}`)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Gérer les phases
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!phases || phases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aucune phase configurée</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {phases.map((phase, index) => (
                      <div 
                        key={phase.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                          style={{ backgroundColor: phase.color || "#3B82F6" }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{phase.name}</p>
                          {phase.description && (
                            <p className="text-sm text-muted-foreground truncate">{phase.description}</p>
                          )}
                        </div>
                        <Badge variant={phase.status === "completed" ? "default" : "secondary"}>
                          {phase.status === "completed" ? "Terminée" : 
                           phase.status === "in_progress" ? "En cours" : "À faire"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
