import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Target,
  ArrowRight,
  Mail,
  Phone,
  Zap,
  TrendingUp,
  Clock,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MailOpen,
  PhoneCall,
  Video,
  ListTodo,
  RefreshCw,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { cn } from "@/lib/utils";
import { CRMActivityFeed } from "./CRMActivityFeed";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { CRMQuickActions } from "./CRMQuickActions";
import { CompanyFormDialog } from "./CompanyFormDialog";
import { ContactFormDialog } from "./ContactFormDialog";
import { formatDistanceToNow, format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns";
import { fr } from "date-fns/locale";

interface CRMOverviewProps {
  onNavigate: (view: string) => void;
}

export function CRMOverview({ onNavigate }: CRMOverviewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const {
    getCompanyTypeShortLabel,
    getCompanyTypeColor,
    getContactTypeLabel,
    getContactTypeColor,
  } = useCRMSettings();

  // Fetch core CRM data
  const { allCompanies: companies, isLoading: companiesLoading } = useCRMCompanies();
  const { allContacts: contacts, isLoading: contactsLoading } = useContacts();
  const { contactPipelines, isLoading: pipelinesLoading } = useCRMPipelines();

  // Complete action mutation
  const completeActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from('pipeline_actions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id || null,
        })
        .eq('id', actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Action terminée');
      queryClient.invalidateQueries({ queryKey: ['upcoming-pipeline-actions'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-actions-all'] });
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Fetch pipeline entries count and stats
  const { data: pipelineStats, isLoading: pipelineStatsLoading } = useQuery({
    queryKey: ["pipeline-entries-stats", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return { total: 0, awaiting: 0, recent: 0, withReplies: 0 };

      const [entriesResult, awaitingResult, recentResult, repliesResult] = await Promise.all([
        // Total entries
        supabase
          .from("contact_pipeline_entries")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspace.id),
        // Awaiting response
        supabase
          .from("contact_pipeline_entries")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspace.id)
          .eq("awaiting_response", true),
        // Recent entries (last 7 days)
        supabase
          .from("contact_pipeline_entries")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspace.id)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        // Entries with unread replies
        supabase
          .from("contact_pipeline_entries")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspace.id)
          .gt("unread_replies_count", 0),
      ]);

      return {
        total: entriesResult.count || 0,
        awaiting: awaitingResult.count || 0,
        recent: recentResult.count || 0,
        withReplies: repliesResult.count || 0,
      };
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 60000,
  });

  // Fetch upcoming actions with contact phone for call actions
  const { data: upcomingActions = [], refetch: refetchActions } = useQuery({
    queryKey: ["upcoming-pipeline-actions", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("pipeline_actions")
        .select(`
          id,
          action_type,
          title,
          due_date,
          priority,
          status,
          contact:contacts(id, name, phone),
          company:crm_companies(id, name, phone)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .eq("status", "pending")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 60000,
  });

  // Fetch entries with unread replies
  const { data: entriesWithReplies = [] } = useQuery({
    queryKey: ["entries-with-replies", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .select(`
          id,
          unread_replies_count,
          last_inbound_email_at,
          contact:contacts(id, name, email),
          company:crm_companies(id, name),
          stage:crm_pipeline_stages(name, color)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .gt("unread_replies_count", 0)
        .order("last_inbound_email_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 60000,
  });

  // Fetch recent pipeline entries for activity
  const { data: recentPipelineEntries = [] } = useQuery({
    queryKey: ["recent-pipeline-entries", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("contact_pipeline_entries")
        .select(`
          id,
          created_at,
          last_email_sent_at,
          awaiting_response,
          contact:contacts(id, name, email),
          company:crm_companies(id, name),
          stage:crm_pipeline_stages(name, color)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 60000,
  });

  const isLoading = companiesLoading || contactsLoading || pipelinesLoading || pipelineStatsLoading;
  const companiesCount = companies.length;
  const contactsCount = contacts.length;

  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 4);
  }, [companies]);

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 4);
  }, [contacts]);

  const stats = [
    {
      id: "companies",
      title: "Entreprises",
      value: companiesCount,
      icon: Building2,
      color: "text-info",
      bgColor: "bg-info/10",
      action: () => onNavigate("companies"),
    },
    {
      id: "contacts",
      title: "Contacts",
      value: contactsCount,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
      action: () => onNavigate("contacts"),
    },
    {
      id: "prospection",
      title: "En prospection",
      value: pipelineStats?.total || 0,
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
      action: () => onNavigate("prospection"),
    },
    {
      id: "recent",
      title: "Nouveaux cette semaine",
      value: pipelineStats?.recent || 0,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => onNavigate("prospection"),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="lg:col-span-3 h-64 rounded-lg" />
          <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vue d'ensemble</h2>
          <p className="text-sm text-muted-foreground">
            Votre activité CRM en un coup d'œil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CRMDataQualityManager />
          <CRMQuickActions
            onCreateCompany={() => setShowCreateCompany(true)}
            onCreateContact={() => setShowCreateContact(true)}
          />
        </div>
      </div>

      {/* Main Stats - 4 columns without sparklines */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer group hover:shadow-md hover:border-primary/20 transition-all duration-200"
              onClick={stat.action}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1.5 rounded-md", stat.bgColor)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Prospection Alerts Row - Only show if there's meaningful data */}
      {((pipelineStats?.withReplies || 0) > 0 || (pipelineStats?.awaiting || 0) > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3"
        >
          {(pipelineStats?.withReplies || 0) > 0 && (
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-success/30 bg-success/5" onClick={() => onNavigate("prospection")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-success/10">
                  <MailOpen className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-success">{pipelineStats?.withReplies || 0}</p>
                  <p className="text-xs text-muted-foreground">Réponses reçues</p>
                </div>
              </CardContent>
            </Card>
          )}
          {(pipelineStats?.awaiting || 0) > 0 && (
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-warning/30 bg-warning/5" onClick={() => onNavigate("prospection")}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-warning/10">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-warning">{pipelineStats?.awaiting || 0}</p>
                  <p className="text-xs text-muted-foreground">En attente de réponse</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Upcoming Actions - Always visible if there are actions */}
      {upcomingActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">
                  Prochaines actions
                </CardTitle>
                <Badge variant="secondary" className="h-5 text-xs">
                  {upcomingActions.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onNavigate("prospection")}
              >
                Voir tout
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {upcomingActions.map((action: any) => {
                  const dueDate = action.due_date ? new Date(action.due_date) : null;
                  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
                  const isDueToday = dueDate && isToday(dueDate);
                  const isDueTomorrow = dueDate && isTomorrow(dueDate);
                  const isCallAction = action.action_type === 'call';
                  const phoneNumber = action.contact?.phone || action.company?.phone;
                  
                  const ActionIcon = {
                    email: Mail,
                    call: PhoneCall,
                    meeting: Video,
                    task: ListTodo,
                    followup: RefreshCw,
                  }[action.action_type as string] || ListTodo;

                  const handleComplete = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    completeActionMutation.mutate(action.id);
                  };

                  return (
                    <div
                      key={action.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group",
                        isOverdue && "bg-destructive/5 border border-destructive/20"
                      )}
                    >
                      {/* Checkbox to complete action */}
                      <Checkbox
                        className="shrink-0"
                        checked={false}
                        onCheckedChange={() => completeActionMutation.mutate(action.id)}
                        disabled={completeActionMutation.isPending}
                      />
                      
                      <div className={cn(
                        "p-1.5 rounded-md shrink-0",
                        isOverdue ? "bg-destructive/10" : "bg-muted"
                      )}>
                        <ActionIcon className={cn(
                          "h-3.5 w-3.5",
                          isOverdue ? "text-destructive" : "text-muted-foreground"
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate("prospection")}>
                        <p className="text-sm font-medium truncate">{action.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            {action.contact?.name || action.company?.name || "—"}
                          </span>
                          {/* Show phone number for call actions */}
                          {isCallAction && phoneNumber && (
                            <a 
                              href={`tel:${phoneNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                            >
                              <Phone className="h-3 w-3" />
                              {phoneNumber}
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {action.priority === "urgent" && (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={cn(
                          "text-xs",
                          isOverdue ? "text-destructive font-medium" : 
                          isDueToday ? "text-warning font-medium" :
                          isDueTomorrow ? "text-info" : "text-muted-foreground"
                        )}>
                          {isOverdue ? "En retard" :
                           isDueToday ? "Aujourd'hui" :
                           isDueTomorrow ? "Demain" :
                           dueDate ? format(dueDate, "d MMM", { locale: fr }) : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Unread Replies Alert */}
      {entriesWithReplies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <MailOpen className="h-4 w-4 text-success" />
                <CardTitle className="text-sm font-medium text-success">
                  Réponses non lues
                </CardTitle>
                <Badge className="h-5 text-xs bg-success text-white">
                  {entriesWithReplies.reduce((acc: number, e: any) => acc + (e.unread_replies_count || 0), 0)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-success hover:text-success"
                onClick={() => onNavigate("prospection")}
              >
                Traiter
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {entriesWithReplies.slice(0, 3).map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-success/10 cursor-pointer transition-colors"
                    onClick={() => onNavigate("prospection")}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: entry.stage?.color || "hsl(var(--success))" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.contact?.name || entry.company?.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.last_inbound_email_at && formatDistanceToNow(new Date(entry.last_inbound_email_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="h-5 text-xs bg-success/10 text-success">
                      {entry.unread_replies_count} non lu{entry.unread_replies_count > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent entities - Left column (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Companies */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    Entreprises récentes
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onNavigate("companies")}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-2">
                {recentCompanies.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Aucune entreprise
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentCompanies.map((company) => {
                      const typeColor = getCompanyTypeColor(company.industry || "");
                      const typeShort = getCompanyTypeShortLabel(company.industry || "");

                      return (
                        <div
                          key={company.id}
                          className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/crm/companies/${company.id}`)}
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-white shrink-0"
                            style={{ backgroundColor: typeColor }}
                          >
                            {typeShort || company.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {company.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {company.city || company.primary_contact?.name || "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {company.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${company.email}`;
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {company.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${company.phone}`;
                                }}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    Contacts récents
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onNavigate("contacts")}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-2">
                {recentContacts.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Aucun contact
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={contact.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-accent/10 text-accent">
                            {contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {contact.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.company?.name || contact.role || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {contact.contact_type && (
                            <Badge
                              variant="outline"
                              className="h-5 text-[10px] px-1.5"
                              style={{
                                borderColor: getContactTypeColor(contact.contact_type),
                                color: getContactTypeColor(contact.contact_type),
                              }}
                            >
                              {getContactTypeLabel(contact.contact_type)}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {contact.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${contact.email}`;
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {contact.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${contact.phone}`;
                                }}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right column (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Pipeline Activity */}
          {recentPipelineEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-success" />
                    <CardTitle className="text-sm font-medium">
                      Prospection récente
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onNavigate("prospection")}
                  >
                    Voir tout
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {recentPipelineEntries.map((entry: any) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onNavigate("prospection")}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: entry.stage?.color || "hsl(var(--muted))" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.contact?.name || entry.company?.name || "—"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{entry.stage?.name || "—"}</span>
                            {entry.awaiting_response && (
                              <Badge variant="outline" className="h-4 text-[10px] px-1 bg-warning/10 text-warning border-warning/30">
                                <Clock className="h-2.5 w-2.5 mr-0.5" />
                                Attente
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {entry.created_at && formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <CardTitle className="text-sm font-medium">
                    Activité récente
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <CRMActivityFeed
                  companies={companies}
                  contacts={contacts}
                  leads={[]}
                  maxItems={8}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Dialogs */}
      <CompanyFormDialog
        mode="create"
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
      />
      <ContactFormDialog
        mode="create"
        open={showCreateContact}
        onOpenChange={setShowCreateContact}
      />
    </div>
  );
}
