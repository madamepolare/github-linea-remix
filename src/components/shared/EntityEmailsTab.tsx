import { useState } from "react";
import { useEntityEmails, EntityType, Email, EmailThread } from "@/hooks/useEntityEmails";
import { ComposeEmailDialog } from "@/components/emails/ComposeEmailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Mail, 
  Plus, 
  Search, 
  Send, 
  Inbox, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Reply,
  MailOpen,
  Settings,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EntityEmailsTabProps {
  entityType: EntityType;
  entityId: string;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
}

export function EntityEmailsTab({ 
  entityType, 
  entityId, 
  defaultRecipientEmail,
  defaultRecipientName 
}: EntityEmailsTabProps) {
  const { 
    emails, 
    threads, 
    stats, 
    isLoading, 
    gmailConnected,
    markAsRead 
  } = useEntityEmails({ entityType, entityId });

  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<Email | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!gmailConnected) return;
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail-sync');
      if (error) throw error;
      toast.success(`${data.synced || 0} email(s) synchronisé(s)`);
    } catch (error: any) {
      toast.error("Erreur de synchronisation");
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter threads based on search and filter
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchQuery || 
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participantEmails.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = filter === 'all' ||
      (filter === 'sent' && thread.emails.some(e => e.direction === 'outbound')) ||
      (filter === 'received' && thread.emails.some(e => e.direction === 'inbound'));

    return matchesSearch && matchesFilter;
  });

  const toggleThread = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
      // Mark all unread emails in thread as read
      const thread = threads.find(t => t.threadId === threadId);
      thread?.emails.forEach(email => {
        if (!email.is_read && email.direction === 'inbound') {
          markAsRead(email.id);
        }
      });
    }
    setExpandedThreads(newExpanded);
  };

  const handleReply = (email: Email) => {
    setReplyTo(email);
    setComposeOpen(true);
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    return parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gmail connection warning */}
      {!gmailConnected && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Gmail non connecté
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Connectez votre compte Gmail pour envoyer et recevoir des emails.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/settings?tab=emails">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres email
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Header with stats and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1">
                <Mail className="h-4 w-4" />
                Tous ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-1">
                <Send className="h-4 w-4" />
                Envoyés ({stats.sent})
              </TabsTrigger>
              <TabsTrigger value="received" className="gap-1">
                <Inbox className="h-4 w-4" />
                Reçus ({stats.received})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSync} 
            disabled={!gmailConnected || isSyncing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Sync...' : 'Sync'}
          </Button>
          <Button onClick={() => { setReplyTo(null); setComposeOpen(true); }} disabled={!gmailConnected}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel email
          </Button>
        </div>
      </div>

      {/* Email list */}
      {filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "Aucun email trouvé" : "Aucun email pour le moment"}
            </p>
            {!searchQuery && gmailConnected && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setComposeOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Envoyer un premier email
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-350px)]">
          <div className="space-y-2">
            {filteredThreads.map(thread => (
              <EmailThreadCard
                key={thread.threadId}
                thread={thread}
                isExpanded={expandedThreads.has(thread.threadId)}
                onToggle={() => toggleThread(thread.threadId)}
                onReply={handleReply}
                getInitials={getInitials}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Compose dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        entityType={entityType}
        entityId={entityId}
        defaultTo={replyTo?.direction === 'inbound' ? replyTo.from_email || undefined : defaultRecipientEmail}
        defaultSubject={replyTo ? `Re: ${replyTo.subject}` : undefined}
        replyToEmailId={replyTo?.id}
        onSuccess={() => setReplyTo(null)}
      />
    </div>
  );
}

// Thread card component
interface EmailThreadCardProps {
  thread: EmailThread;
  isExpanded: boolean;
  onToggle: () => void;
  onReply: (email: Email) => void;
  getInitials: (email: string) => string;
}

function EmailThreadCard({ thread, isExpanded, onToggle, onReply, getInitials }: EmailThreadCardProps) {
  const lastEmail = thread.emails[thread.emails.length - 1];
  const isUnread = thread.unreadCount > 0;

  return (
    <Card className={cn(isUnread && "border-primary/50 bg-primary/5")}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs">
                  {getInitials(thread.participantEmails[0] || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium truncate", isUnread && "font-semibold")}>
                    {thread.subject}
                  </span>
                  {thread.emails.length > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {thread.emails.length}
                    </Badge>
                  )}
                  {isUnread && (
                    <Badge variant="default" className="text-xs">
                      {thread.unreadCount} nouveau{thread.unreadCount > 1 ? 'x' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span className="truncate">
                    {thread.participantEmails.slice(0, 2).join(', ')}
                    {thread.participantEmails.length > 2 && ` +${thread.participantEmails.length - 2}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {lastEmail.body.replace(/<[^>]*>/g, '').slice(0, 100)}...
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(thread.lastEmailDate), { addSuffix: true, locale: fr })}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            {thread.emails.map((email, index) => (
              <EmailItem 
                key={email.id} 
                email={email} 
                isLast={index === thread.emails.length - 1}
                onReply={() => onReply(email)}
                getInitials={getInitials}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Individual email item
interface EmailItemProps {
  email: Email;
  isLast: boolean;
  onReply: () => void;
  getInitials: (email: string) => string;
}

function EmailItem({ email, isLast, onReply, getInitials }: EmailItemProps) {
  const isOutbound = email.direction === 'outbound';
  const senderEmail = isOutbound ? email.from_email || 'Moi' : email.from_email || email.to_email;

  return (
    <div className={cn("p-4", !isLast && "border-b")}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {isOutbound ? 'ME' : getInitials(senderEmail)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {isOutbound ? 'Moi' : senderEmail}
            </span>
            <Badge variant={isOutbound ? "default" : "secondary"} className="text-xs">
              {isOutbound ? <Send className="h-3 w-3 mr-1" /> : <Inbox className="h-3 w-3 mr-1" />}
              {isOutbound ? 'Envoyé' : 'Reçu'}
            </Badge>
            {email.opened_at && (
              <Badge variant="outline" className="text-xs">
                <MailOpen className="h-3 w-3 mr-1" />
                Lu
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            À : {email.to_email}
            {email.cc && email.cc.length > 0 && ` • Cc: ${email.cc.join(', ')}`}
          </p>
          <div 
            className="mt-3 text-sm prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
          <div className="flex items-center gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={onReply}>
              <Reply className="h-4 w-4 mr-1" />
              Répondre
            </Button>
            {email.gmail_message_id && (
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
              >
                <a 
                  href={`https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Gmail
                </a>
              </Button>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {email.sent_at || email.received_at || email.created_at
            ? format(new Date(email.sent_at || email.received_at || email.created_at!), 'dd MMM yyyy HH:mm', { locale: fr })
            : '-'
          }
        </span>
      </div>
    </div>
  );
}
