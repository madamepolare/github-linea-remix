import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  FileText,
  Clock,
  MessageSquare,
  CheckCircle2,
  Circle,
  MapPin,
  TrendingUp,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Lead, useLeads } from "@/hooks/useLeads";
import { useLeadActivities, LeadActivity } from "@/hooks/useLeadActivities";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (lead: Lead) => void;
}

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

export function LeadDetailSheet({ lead, open, onOpenChange, onEdit }: LeadDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  
  const { updateLead, deleteLead } = useLeads();
  const { activities, isLoading: activitiesLoading, createActivity } = useLeadActivities({ leadId: lead?.id });

  if (!lead) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    }).format(value);
  };

  const weightedValue = lead.estimated_value && lead.probability 
    ? (lead.estimated_value * lead.probability) / 100 
    : null;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
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
    updateLead.mutate({ 
      id: lead.id, 
      status: "won", 
      won_at: new Date().toISOString() 
    });
  };

  const handleMarkLost = () => {
    updateLead.mutate({ 
      id: lead.id, 
      status: "lost", 
      lost_at: new Date().toISOString() 
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <SheetTitle className="text-xl leading-tight">{lead.title}</SheetTitle>
              {lead.stage && (
                <Badge 
                  style={{ backgroundColor: lead.stage.color || "#6366f1" }}
                  className="text-white"
                >
                  {lead.stage.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold">
                {lead.estimated_value ? formatCurrency(lead.estimated_value) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Valeur estimée</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold">{lead.probability || 0}%</p>
              <p className="text-xs text-muted-foreground">Probabilité</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold">
                {weightedValue ? formatCurrency(weightedValue) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Valeur pondérée</p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="text-xs">Aperçu</TabsTrigger>
            <TabsTrigger value="activities" className="text-xs">Activités</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Détails</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            {/* Company & Contact */}
            {lead.company && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead.company.name}</p>
                  <p className="text-xs text-muted-foreground">Maître d'ouvrage</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}

            {lead.contact && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {lead.contact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead.contact.name}</p>
                  {lead.contact.email && (
                    <p className="text-xs text-muted-foreground truncate">{lead.contact.email}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {lead.contact.email && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={`mailto:${lead.contact.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Next Action */}
            {lead.next_action && (
              <div className="p-3 border border-primary/20 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Prochaine action</span>
                </div>
                <p className="text-sm">{lead.next_action}</p>
                {lead.next_action_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(lead.next_action_date), "d MMMM yyyy", { locale: fr })}
                  </p>
                )}
              </div>
            )}

            {/* Quick Note */}
            <div className="space-y-2">
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
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={handleMarkWon}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Gagné
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleMarkLost}
              >
                <Circle className="h-4 w-4 mr-2" />
                Perdu
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="mt-0">
            <div className="space-y-3">
              {activitiesLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune activité</p>
                </div>
              ) : (
                <AnimatePresence>
                  {activities.map((activity, index) => (
                    <ActivityItem key={activity.id} activity={activity} index={index} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-0">
            <div className="space-y-3">
              <DetailRow icon={DollarSign} label="Valeur estimée" value={lead.estimated_value ? formatCurrency(lead.estimated_value) : "—"} />
              <DetailRow icon={TrendingUp} label="Probabilité" value={`${lead.probability || 0}%`} />
              <DetailRow icon={Calendar} label="Créé le" value={format(new Date(lead.created_at), "d MMMM yyyy", { locale: fr })} />
              <DetailRow icon={User} label="Source" value={lead.source ? sourceLabels[lead.source] || lead.source : "—"} />
              
              {lead.description && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ActivityItem({ activity, index }: { activity: LeadActivity; index: number }) {
  const Icon = activityTypeIcons[activity.activity_type] || FileText;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
        activity.is_completed ? "bg-muted" : "bg-primary/10"
      )}>
        <Icon className={cn(
          "h-4 w-4",
          activity.is_completed ? "text-muted-foreground" : "text-primary"
        )} />
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
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
    </motion.div>
  );
}
