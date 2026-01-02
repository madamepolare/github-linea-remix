import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  User,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  MessageSquare,
  Plus,
  FileText,
  Clock,
} from "lucide-react";
import { useLeads, Lead, usePipelines } from "@/hooks/useLeads";
import { useLeadActivities, LeadActivity } from "@/hooks/useLeadActivities";
import { EntityTasksList } from "@/components/tasks/EntityTasksList";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const activityTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckCircle2,
};

const activityTypeLabels: Record<string, string> = {
  call: "Appel",
  email: "Email",
  meeting: "Réunion",
  note: "Note",
  task: "Tâche",
};

const sourceLabels: Record<string, string> = {
  referral: "Recommandation",
  website: "Site web",
  network: "Réseau",
  tender: "Appel d'offres",
  direct: "Contact direct",
  social: "Réseaux sociaux",
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, isLoading, updateLead } = useLeads();
  const { pipelines } = usePipelines();
  const { activities, createActivity, isLoading: activitiesLoading } = useLeadActivities({ leadId: id });
  const { allCompanies } = useCRMCompanies();
  const { allContacts } = useContacts();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [newNote, setNewNote] = useState("");

  const lead = leads.find((l) => l.id === id);
  const company = lead?.crm_company_id ? allCompanies.find((c) => c.id === lead.crm_company_id) : null;
  const contact = lead?.contact_id ? allContacts.find((c) => c.id === lead.contact_id) : null;
  const pipeline = lead?.pipeline_id ? pipelines.find((p) => p.id === lead.pipeline_id) : null;

  useEffect(() => {
    if (lead) {
      setEditData(lead);
    }
  }, [lead]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSave = () => {
    if (lead && editData) {
      updateLead.mutate({ id: lead.id, ...editData });
      setIsEditing(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;
    await createActivity.mutateAsync({
      lead_id: lead.id,
      activity_type: "note",
      title: "Note",
      description: newNote,
      is_completed: true,
    });
    setNewNote("");
  };

  const handleMarkWon = () => {
    if (lead) {
      updateLead.mutate({ id: lead.id, status: "won", won_at: new Date().toISOString() });
    }
  };

  const handleMarkLost = () => {
    if (lead) {
      updateLead.mutate({ id: lead.id, status: "lost", lost_at: new Date().toISOString() });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!lead) {
    return (
      <MainLayout>
        <div className="p-6 max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/crm")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au CRM
          </Button>
          <div className="text-center py-16">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Opportunité non trouvée</h2>
          </div>
        </div>
      </MainLayout>
    );
  }

  const weightedValue =
    lead.estimated_value && lead.probability ? (lead.estimated_value * lead.probability) / 100 : null;

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{lead.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {lead.stage && (
                <Badge
                  style={{ backgroundColor: lead.stage.color || "#6366f1" }}
                  className="text-white"
                >
                  {lead.stage.name}
                </Badge>
              )}
              {lead.status === "won" && (
                <Badge className="bg-emerald-500 text-white">Gagné</Badge>
              )}
              {lead.status === "lost" && (
                <Badge className="bg-destructive text-white">Perdu</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={updateLead.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {lead.estimated_value ? formatCurrency(lead.estimated_value) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Valeur estimée</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-xl font-bold">{lead.probability || 0}%</p>
                <p className="text-xs text-muted-foreground">Probabilité</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-xl font-bold">
                  {weightedValue ? formatCurrency(weightedValue) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Valeur pondérée</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{activities.length}</p>
                <p className="text-xs text-muted-foreground">Activités</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="activities">Activités ({activities.length})</TabsTrigger>
                <TabsTrigger value="tasks">Tâches</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Company & Contact Cards */}
                {company && (
                  <Link
                    to={`/crm/companies/${company.id}`}
                    className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">Maître d'ouvrage</p>
                    </div>
                  </Link>
                )}

                {contact && (
                  <Link
                    to={`/crm/contacts/${contact.id}`}
                    className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{contact.name}</p>
                      {contact.email && (
                        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {contact.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `mailto:${contact.email}`;
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Link>
                )}

                {/* Next Action */}
                {lead.next_action && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Prochaine action</span>
                      </div>
                      <p className="text-sm">{lead.next_action}</p>
                      {lead.next_action_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(lead.next_action_date), "d MMMM yyyy", { locale: fr })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quick Note */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Textarea
                      placeholder="Ajouter une note rapide..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || createActivity.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    {activitiesLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune activité</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity, index) => {
                          const Icon = activityTypeIcons[activity.activity_type] || FileText;
                          return (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                  activity.is_completed ? "bg-muted" : "bg-primary/10"
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "h-4 w-4",
                                    activity.is_completed ? "text-muted-foreground" : "text-primary"
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{activity.title}</p>
                                  <Badge variant="secondary" className="text-2xs">
                                    {activityTypeLabels[activity.activity_type] || activity.activity_type}
                                  </Badge>
                                </div>
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                    {activity.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(activity.created_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <EntityTasksList
                  entityType="lead"
                  entityId={lead.id}
                  entityName={lead.title}
                />
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    {isEditing ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground">Titre</label>
                          <Input
                            value={editData.title || ""}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Valeur estimée (€)</label>
                          <Input
                            type="number"
                            value={editData.estimated_value || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, estimated_value: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Probabilité (%)</label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={editData.probability || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, probability: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Source</label>
                          <Select
                            value={editData.source || ""}
                            onValueChange={(v) => setEditData({ ...editData, source: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(sourceLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs text-muted-foreground">Description</label>
                          <Textarea
                            value={editData.description || ""}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Prochaine action</label>
                          <Input
                            value={editData.next_action || ""}
                            onChange={(e) => setEditData({ ...editData, next_action: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Date prochaine action</label>
                          <Input
                            type="date"
                            value={editData.next_action_date || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, next_action_date: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <DetailRow label="Valeur estimée" value={lead.estimated_value ? formatCurrency(lead.estimated_value) : "—"} />
                        <DetailRow label="Probabilité" value={`${lead.probability || 0}%`} />
                        <DetailRow label="Valeur pondérée" value={weightedValue ? formatCurrency(weightedValue) : "—"} />
                        <DetailRow label="Source" value={lead.source ? sourceLabels[lead.source] || lead.source : "—"} />
                        <DetailRow label="Créé le" value={format(new Date(lead.created_at), "d MMMM yyyy", { locale: fr })} />
                        {lead.description && (
                          <div className="pt-2">
                            <p className="text-sm font-medium mb-1">Description</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {lead.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={handleMarkWon}
                  disabled={lead.status === "won"}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer comme gagné
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/5"
                  onClick={handleMarkLost}
                  disabled={lead.status === "lost"}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Marquer comme perdu
                </Button>
              </CardContent>
            </Card>

            {/* Stage Selector */}
            {pipeline && pipeline.stages && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Étape du pipeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {pipeline.stages.map((stage) => (
                    <Button
                      key={stage.id}
                      variant={lead.stage_id === stage.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => updateLead.mutate({ id: lead.id, stage_id: stage.id })}
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: stage.color || "#6366f1" }}
                      />
                      {stage.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
