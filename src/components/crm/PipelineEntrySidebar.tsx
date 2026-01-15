import { useState, useEffect } from "react";
import { X, User, Building2, Mail, Phone, Calendar, Send, Clock, Plus, MessageSquare, FileText, ExternalLink, RefreshCw, Bell, AlertTriangle, MailOpen } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PipelineEntry } from "@/hooks/useContactPipeline";
import { useEntityEmails, Email, EmailThread } from "@/hooks/useEntityEmails";
import { usePipelineActions } from "@/hooks/usePipelineActions";
import { useEntityActivities, logEntityActivity } from "@/hooks/useEntityActivities";
import { useAuth } from "@/contexts/AuthContext";
import { ComposeEmailDialog } from "@/components/emails/ComposeEmailDialog";
import { EmailThreadCard } from "@/components/crm/pipeline/EmailThreadCard";
import { PipelineEmailDetailView } from "@/components/crm/pipeline/PipelineEmailDetailView";
import { ActionFormDialog } from "@/components/crm/pipeline/ActionFormDialog";
import { ActionsList } from "@/components/crm/pipeline/ActionsList";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PipelineEntrySidebarProps {
  entry: PipelineEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateNotes?: (entryId: string, notes: string) => void;
}

export function PipelineEntrySidebar({ 
  entry, 
  open, 
  onOpenChange,
  onUpdateNotes 
}: PipelineEntrySidebarProps) {
  const navigate = useNavigate();
  const { user, activeWorkspace } = useAuth();
  
  const [composeOpen, setComposeOpen] = useState(false);
  const [actionFormOpen, setActionFormOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  
  const isContact = !!entry?.contact;
  const entityType = isContact ? 'contact' : 'company';
  const entityId = isContact ? entry?.contact_id : entry?.company_id;
  const entity = entry?.contact || entry?.company;
  
  // Reset notes and selected thread when entry changes
  useEffect(() => {
    setNotes(entry?.notes || "");
    setSelectedThread(null);
  }, [entry?.id, entry?.notes]);
  
  const { threads, stats, isLoading: emailsLoading, gmailConnected, markAsRead } = useEntityEmails({
    entityType: entityType as any,
    entityId: entityId || '',
    enabled: open && !!entityId,
  });

  const { 
    actions, 
    pendingCount, 
    overdueCount,
    createAction,
    completeAction,
    deleteAction,
    isCreating 
  } = usePipelineActions(entry?.id, activeWorkspace?.id);

  const { activities } = useEntityActivities(entityType, entityId, activeWorkspace?.id);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail-sync');
      if (error) throw error;
      toast.success(`${data.synced || 0} email(s) synchronisé(s)`);
    } catch (error) {
      toast.error("Erreur de synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNotes = () => {
    if (entry && onUpdateNotes) {
      onUpdateNotes(entry.id, notes);
    }
  };

  const navigateToEntity = () => {
    if (isContact && entry?.contact_id) {
      navigate(`/crm/contacts/${entry.contact_id}`);
    } else if (!isContact && entry?.company_id) {
      navigate(`/crm/companies/${entry.company_id}`);
    }
  };

  const handleReplyEmail = (email: Email) => {
    setReplyToEmail(email);
    setIsFollowUp(false);
    setComposeOpen(true);
  };

  const handleFollowUpEmail = (email: Email) => {
    setReplyToEmail(email);
    setIsFollowUp(true);
    setComposeOpen(true);
  };

  const handleEmailSent = async () => {
    // Log activity
    if (activeWorkspace?.id && entityId) {
      await logEntityActivity(
        activeWorkspace.id,
        user?.id,
        {
          entity_type: entityType,
          entity_id: entityId,
          activity_type: 'email_sent',
          title: 'Email envoyé',
          description: replyToEmail 
            ? (isFollowUp ? 'Relance envoyée' : 'Réponse envoyée')
            : 'Nouvel email envoyé',
          metadata: {
            entry_id: entry?.id,
            subject: replyToEmail?.subject,
          }
        }
      );
    }
    setReplyToEmail(null);
    setIsFollowUp(false);
  };

  const handleActionCreated = async (input: any) => {
    createAction(input);
    
    // Log activity
    if (activeWorkspace?.id && entityId) {
      await logEntityActivity(
        activeWorkspace.id,
        user?.id,
        {
          entity_type: entityType,
          entity_id: entityId,
          activity_type: 'action_created',
          title: 'Action planifiée',
          description: input.title,
          metadata: {
            entry_id: entry?.id,
            action_type: input.action_type,
            due_date: input.due_date,
          }
        }
      );
    }
  };

  const handleActionCompleted = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    completeAction(actionId);
    
    // Log activity
    if (activeWorkspace?.id && entityId && action) {
      await logEntityActivity(
        activeWorkspace.id,
        user?.id,
        {
          entity_type: entityType,
          entity_id: entityId,
          activity_type: 'action_completed',
          title: 'Action terminée',
          description: action.title,
          metadata: {
            entry_id: entry?.id,
            action_type: action.action_type,
          }
        }
      );
    }
  };

  if (!entry) return null;

  const name = entity?.name || "Sans nom";
  const email = isContact ? entry.contact?.email : entry.company?.email;
  const phone = isContact ? entry.contact?.phone : entry.company?.phone;

  // Build default compose values based on context
  const getComposeDefaults = () => {
    if (replyToEmail) {
      const replySubject = replyToEmail.subject.startsWith('Re:') 
        ? replyToEmail.subject 
        : `Re: ${replyToEmail.subject}`;
      
      const followUpSubject = replyToEmail.subject.startsWith('Re:')
        ? replyToEmail.subject
        : `Relance: ${replyToEmail.subject}`;

      const replyBody = `\n\n---\nLe ${format(new Date(replyToEmail.sent_at || replyToEmail.created_at || new Date()), "d MMMM yyyy 'à' HH:mm", { locale: fr })}, ${replyToEmail.from_email} a écrit :\n\n${replyToEmail.body.replace(/<[^>]*>/g, '')}`;

      return {
        to: replyToEmail.from_email || email || undefined,
        subject: isFollowUp ? followUpSubject : replySubject,
        body: isFollowUp 
          ? `Bonjour,\n\nJe me permets de revenir vers vous concernant mon email précédent.\n\nCordialement,`
          : replyBody,
        replyToEmailId: replyToEmail.id,
      };
    }
    return { to: email || undefined };
  };

  const composeDefaults = getComposeDefaults();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={isContact ? entry.contact?.avatar_url : entry.company?.logo_url} />
                <AvatarFallback className="text-lg">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isContact ? (
                    <User className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <SheetTitle className="text-lg truncate">{name}</SheetTitle>
                </div>
                
                {isContact && entry.company && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {entry.company.name}
                  </p>
                )}
                
                <div className="flex items-center gap-3 mt-2">
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{email}</span>
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{phone}</span>
                    </a>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="icon" onClick={navigateToEntity}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Alert section */}
            <div className="mt-3 pt-3 border-t space-y-2">
              {/* No actions planned alert */}
              {pendingCount === 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                      Aucune action prévue
                    </p>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300">
                      Planifiez une relance pour ne pas perdre ce contact
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    onClick={() => setActionFormOpen(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Planifier
                  </Button>
                </div>
              )}

              {/* Overdue actions alert */}
              {overdueCount > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200">
                      {overdueCount} action{overdueCount > 1 ? 's' : ''} en retard !
                    </p>
                    <p className="text-[10px] text-red-700 dark:text-red-300">
                      À traiter immédiatement
                    </p>
                  </div>
                </div>
              )}

              {/* Urgent upcoming action alert */}
              {pendingCount > 0 && overdueCount === 0 && (() => {
                const upcomingUrgent = actions.find(a => {
                  if (a.status !== 'pending' || !a.due_date) return false;
                  const hoursUntil = (new Date(a.due_date).getTime() - Date.now()) / (1000 * 60 * 60);
                  return hoursUntil > 0 && hoursUntil <= 24;
                });
                
                if (!upcomingUrgent) return null;
                
                const hoursUntil = Math.round((new Date(upcomingUrgent.due_date!).getTime() - Date.now()) / (1000 * 60 * 60));
                
                return (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <Clock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                        Action urgente : {upcomingUrgent.title}
                      </p>
                      <p className="text-[10px] text-orange-700 dark:text-orange-300">
                        Dans {hoursUntil}h - À faire aujourd'hui
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Unread emails badge */}
              {stats.unread > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">
                      {stats.unread} réponse{stats.unread > 1 ? 's' : ''} client non lue{stats.unread > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-green-700 dark:text-green-300">
                      À consulter et répondre
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue="emails" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid grid-cols-3">
              <TabsTrigger value="emails" className="gap-1">
                <Mail className="h-3.5 w-3.5" />
                Emails
                {stats.total > 0 && (
                  <Badge variant={stats.unread > 0 ? "default" : "secondary"} className="h-5 text-[10px] px-1.5">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1">
                <Clock className="h-3.5 w-3.5" />
                Actions
                {pendingCount > 0 && (
                  <Badge variant={overdueCount > 0 ? "destructive" : "secondary"} className="h-5 text-[10px] px-1.5">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="flex-1 overflow-hidden m-0 px-6 pt-4">
              {selectedThread ? (
                <PipelineEmailDetailView
                  thread={selectedThread}
                  onBack={() => setSelectedThread(null)}
                  onReply={handleReplyEmail}
                  onFollowUp={handleFollowUpEmail}
                  onMarkAsRead={markAsRead}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Historique emails</h4>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleSync}
                        disabled={isSyncing || !gmailConnected}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setReplyToEmail(null);
                          setIsFollowUp(false);
                          setComposeOpen(true);
                        }}
                        disabled={!gmailConnected}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(100vh-420px)]">
                    {emailsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : threads.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">Aucun email</p>
                        {gmailConnected && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => setComposeOpen(true)}
                          >
                            Envoyer un email
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {threads.map(thread => (
                          <div 
                            key={thread.threadId}
                            onClick={() => setSelectedThread(thread)}
                            className="cursor-pointer"
                          >
                            <EmailThreadCard
                              thread={thread}
                              onReply={handleReplyEmail}
                              onFollowUp={handleFollowUpEmail}
                              onMarkAsRead={markAsRead}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            <TabsContent value="actions" className="flex-1 overflow-hidden m-0 px-6 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Actions à planifier</h4>
                <Button size="sm" onClick={() => setActionFormOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Action
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-420px)]">
                <ActionsList
                  actions={actions}
                  onComplete={handleActionCompleted}
                  onDelete={deleteAction}
                />

                {/* Entry timeline */}
                <Separator className="my-4" />
                
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Historique
                </h5>

                <div className="space-y-3">
                  {/* Recent activities */}
                  {activities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {activity.activity_type === 'email_sent' ? (
                          <Send className="h-3 w-3 text-primary" />
                        ) : activity.activity_type === 'action_completed' ? (
                          <Clock className="h-3 w-3 text-green-500" />
                        ) : (
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground">{activity.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Fallback timeline */}
                  {activities.length === 0 && (
                    <>
                      {entry.last_email_sent_at && (
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Send className="h-3 w-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm">Email envoyé</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.last_email_sent_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {entry.entered_at && (
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm">Ajouté au pipeline</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(entry.entered_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-hidden m-0 px-6 pt-4">
              <div className="flex flex-col h-full">
                <h4 className="text-sm font-medium mb-3">Notes</h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajouter des notes sur ce contact..."
                  className="flex-1 min-h-[200px] resize-none"
                />
                <Button 
                  className="mt-3" 
                  onClick={handleSaveNotes}
                  disabled={notes === entry.notes}
                >
                  Enregistrer
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) {
            setReplyToEmail(null);
            setIsFollowUp(false);
          }
        }}
        entityType={entityType as any}
        entityId={entityId}
        defaultTo={composeDefaults.to}
        defaultSubject={composeDefaults.subject}
        defaultBody={composeDefaults.body}
        replyToEmailId={composeDefaults.replyToEmailId}
        onSuccess={handleEmailSent}
      />

      {/* Action Form Dialog */}
      <ActionFormDialog
        open={actionFormOpen}
        onOpenChange={setActionFormOpen}
        onSubmit={handleActionCreated}
        entryId={entry?.id || ''}
        contactId={entry?.contact_id}
        companyId={entry?.company_id}
        isLoading={isCreating}
      />
    </>
  );
}
