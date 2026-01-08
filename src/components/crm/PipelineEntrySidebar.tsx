import { useState } from "react";
import { X, User, Building2, Mail, Phone, Calendar, Send, Clock, Plus, MessageSquare, FileText, ExternalLink, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PipelineEntry } from "@/hooks/useContactPipeline";
import { useEntityEmails } from "@/hooks/useEntityEmails";
import { ComposeEmailDialog } from "@/components/emails/ComposeEmailDialog";
import { useLeadActivities } from "@/hooks/useLeadActivities";
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
  const [composeOpen, setComposeOpen] = useState(false);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const isContact = !!entry?.contact;
  const entityType = isContact ? 'contact' : 'company';
  const entityId = isContact ? entry?.contact_id : entry?.company_id;
  const entity = entry?.contact || entry?.company;
  
  const { threads, stats, isLoading: emailsLoading, gmailConnected } = useEntityEmails({
    entityType: entityType as any,
    entityId: entityId || '',
    enabled: open && !!entityId,
  });

  // Placeholder for future activities integration
  // Activities would need to be associated with contacts/companies, not just leads

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

  if (!entry) return null;

  const name = entity?.name || "Sans nom";
  const email = isContact ? entry.contact?.email : entry.company?.email;
  const phone = isContact ? entry.contact?.phone : entry.company?.phone;

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
          </SheetHeader>

          <Tabs defaultValue="emails" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid grid-cols-3">
              <TabsTrigger value="emails" className="gap-1">
                <Mail className="h-3.5 w-3.5" />
                Emails
                {stats.total > 0 && (
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1">
                <Clock className="h-3.5 w-3.5" />
                Actions
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emails" className="flex-1 overflow-hidden m-0 px-6 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Historique emails</h4>
                  {stats.unread > 0 && (
                    <Badge variant="default" className="text-[10px]">
                      {stats.unread} non lu{stats.unread > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
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
                    onClick={() => setComposeOpen(true)}
                    disabled={!gmailConnected}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Email
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-380px)]">
                {emailsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
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
                  <div className="space-y-2">
                    {threads.map(thread => (
                      <Card key={thread.threadId} className={cn(
                        "transition-colors cursor-pointer hover:bg-muted/50",
                        thread.unreadCount > 0 && "border-primary/50 bg-primary/5"
                      )}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm truncate",
                                thread.unreadCount > 0 && "font-semibold"
                              )}>
                                {thread.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {thread.emails[thread.emails.length - 1]?.body
                                  .replace(/<[^>]*>/g, '')
                                  .slice(0, 80)}...
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(thread.lastEmailDate), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}
                              </span>
                              <div className="flex items-center gap-1">
                                {thread.emails.length > 1 && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    {thread.emails.length}
                                  </Badge>
                                )}
                                {thread.unreadCount > 0 && (
                                  <Badge className="text-[10px] h-4 px-1">
                                    {thread.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="flex-1 overflow-hidden m-0 px-6 pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">Actions à planifier</h4>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Action
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-3">
                  {/* Placeholder for future actions */}
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Aucune action planifiée
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Les actions seront affichées ici
                      </p>
                    </CardContent>
                  </Card>

                  {/* Entry timeline */}
                  <Separator className="my-4" />
                  
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Historique
                  </h5>

                  <div className="space-y-3">
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
                  </div>
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
        onOpenChange={setComposeOpen}
        entityType={entityType as any}
        entityId={entityId}
        defaultTo={email || undefined}
      />
    </>
  );
}
