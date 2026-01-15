import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowLeft,
  Mail, 
  Reply, 
  Forward,
  CornerUpRight,
  ExternalLink,
  MailOpen,
  Send,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmailThread, Email } from "@/hooks/useEntityEmails";

interface PipelineEmailDetailViewProps {
  thread: EmailThread;
  onBack: () => void;
  onReply: (email: Email) => void;
  onFollowUp: (email: Email) => void;
  onMarkAsRead?: (emailId: string) => void;
}

function DetailedEmailMessage({ 
  email, 
  onReply, 
  onFollowUp 
}: { 
  email: Email; 
  onReply: (email: Email) => void;
  onFollowUp: (email: Email) => void;
}) {
  const [showFullBody, setShowFullBody] = useState(false);
  const isInbound = email.direction === 'inbound';
  const sender = isInbound ? email.from_email : 'Moi';
  
  // Render HTML body safely
  const renderBody = () => {
    if (email.body.includes('<')) {
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ 
            __html: email.body
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          }} 
        />
      );
    }
    return <p className="whitespace-pre-wrap">{email.body}</p>;
  };

  const bodyPreview = email.body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const isLongEmail = bodyPreview.length > 500;

  return (
    <div className={cn(
      "relative pl-6 pb-6",
      "before:absolute before:left-[11px] before:top-8 before:bottom-0 before:w-0.5",
      isInbound 
        ? "before:bg-green-200 dark:before:bg-green-900" 
        : "before:bg-muted"
    )}>
      {/* Timeline dot */}
      <div className={cn(
        "absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center",
        isInbound 
          ? "bg-green-100 dark:bg-green-900/50" 
          : "bg-muted"
      )}>
        {isInbound ? (
          <MailOpen className="h-3 w-3 text-green-600 dark:text-green-400" />
        ) : (
          <Send className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      <div className={cn(
        "ml-4 p-4 rounded-lg border",
        isInbound 
          ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
          : "bg-muted/30 border-border"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {isInbound ? (email.from_email?.slice(0, 2).toUpperCase() || 'IN') : 'ME'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  !email.is_read && isInbound && "font-bold"
                )}>
                  {sender}
                </span>
                {!email.is_read && isInbound && (
                  <Badge variant="default" className="h-4 text-[9px] px-1">Nouveau</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {email.sent_at || email.received_at || email.created_at 
                  ? format(new Date(email.sent_at || email.received_at || email.created_at!), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })
                  : ''
                }
              </p>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => onReply(email)}
              title="Répondre"
            >
              <Reply className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => onFollowUp(email)}
              title="Relancer"
            >
              <CornerUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Recipients */}
        <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
          <p>À : {email.to_email}</p>
          {email.cc && email.cc.length > 0 && (
            <p>Cc : {email.cc.join(', ')}</p>
          )}
        </div>

        <Separator className="my-3" />
        
        {/* Body */}
        <div className={cn(
          "text-sm",
          isLongEmail && !showFullBody && "max-h-[200px] overflow-hidden relative"
        )}>
          {renderBody()}
          
          {isLongEmail && !showFullBody && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>
        
        {isLongEmail && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowFullBody(!showFullBody)}
          >
            {showFullBody ? 'Réduire' : 'Voir tout le message'}
          </Button>
        )}

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              <Paperclip className="h-3 w-3 inline mr-1" />
              {email.attachments.length} pièce(s) jointe(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {att.name || `Pièce jointe ${idx + 1}`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelineEmailDetailView({ 
  thread, 
  onBack, 
  onReply, 
  onFollowUp,
  onMarkAsRead 
}: PipelineEmailDetailViewProps) {
  const lastEmail = thread.emails[thread.emails.length - 1];

  // Mark unread emails as read when viewing
  useState(() => {
    thread.emails
      .filter(e => !e.is_read && e.direction === 'inbound')
      .forEach(e => onMarkAsRead?.(e.id));
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 flex-shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight">
            {thread.subject}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {thread.emails.length} message{thread.emails.length > 1 ? 's' : ''} • 
            {' '}Dernière activité {formatDistanceToNow(new Date(thread.lastEmailDate), { addSuffix: true, locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {thread.unreadCount > 0 && (
            <Badge className="h-5 text-[10px] px-1.5">
              {thread.unreadCount} non lu{thread.unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="py-3 border-b">
        <p className="text-xs text-muted-foreground">
          Participants : {thread.participantEmails.join(', ')}
        </p>
      </div>

      {/* Email Timeline */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-0">
          {thread.emails.map((email) => (
            <DetailedEmailMessage
              key={email.id}
              email={email}
              onReply={onReply}
              onFollowUp={onFollowUp}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions Footer */}
      <div className="pt-4 border-t bg-background">
        <div className="flex gap-2">
          <Button 
            className="flex-1"
            onClick={() => onReply(lastEmail)}
          >
            <Reply className="h-4 w-4 mr-2" />
            Répondre
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => onFollowUp(lastEmail)}
          >
            <CornerUpRight className="h-4 w-4 mr-2" />
            Relancer
          </Button>
        </div>
      </div>
    </div>
  );
}
