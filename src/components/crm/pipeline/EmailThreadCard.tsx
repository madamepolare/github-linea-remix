import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Reply, 
  Forward,
  CornerUpRight,
  Check,
  User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { EmailThread, Email } from "@/hooks/useEntityEmails";

interface EmailThreadCardProps {
  thread: EmailThread;
  onReply: (email: Email) => void;
  onFollowUp: (email: Email) => void;
  onMarkAsRead?: (emailId: string) => void;
}

function EmailMessage({ 
  email, 
  isLast, 
  onReply, 
  onFollowUp 
}: { 
  email: Email; 
  isLast: boolean;
  onReply: (email: Email) => void;
  onFollowUp: (email: Email) => void;
}) {
  const isInbound = email.direction === 'inbound';
  const sender = isInbound ? email.from_email : 'Moi';
  
  // Clean HTML from body for preview
  const cleanBody = email.body
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className={cn(
      "py-3 px-3 rounded-lg",
      isInbound ? "bg-muted/50" : "bg-primary/5 ml-4"
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {isInbound ? (email.from_email?.slice(0, 2).toUpperCase() || 'IN') : 'ME'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className={cn(
              "text-xs",
              !email.is_read && isInbound && "font-semibold"
            )}>
              {sender}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {email.sent_at || email.received_at || email.created_at 
                ? format(new Date(email.sent_at || email.received_at || email.created_at!), "dd MMM à HH:mm", { locale: fr })
                : ''
              }
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!email.is_read && isInbound && (
            <Badge variant="default" className="h-4 text-[9px] px-1">Nouveau</Badge>
          )}
          {isLast && (
            <div className="flex gap-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => onReply(email)}
                title="Répondre"
              >
                <Reply className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => onFollowUp(email)}
                title="Relancer"
              >
                <CornerUpRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
        {cleanBody.length > 300 ? cleanBody.slice(0, 300) + '...' : cleanBody}
      </div>
    </div>
  );
}

export function EmailThreadCard({ thread, onReply, onFollowUp, onMarkAsRead }: EmailThreadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lastEmail = thread.emails[thread.emails.length - 1];
  const hasMultipleEmails = thread.emails.length > 1;

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    // Mark unread emails as read when expanded
    if (!isExpanded && onMarkAsRead) {
      thread.emails
        .filter(e => !e.is_read && e.direction === 'inbound')
        .forEach(e => onMarkAsRead(e.id));
    }
  };

  return (
    <Card className={cn(
      "transition-all",
      thread.unreadCount > 0 && "border-primary/50 bg-primary/5"
    )}>
      <Collapsible open={isExpanded} onOpenChange={handleExpand}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                thread.unreadCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Mail className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm truncate",
                    thread.unreadCount > 0 && "font-semibold"
                  )}>
                    {thread.subject}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {hasMultipleEmails && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {thread.emails.length}
                      </Badge>
                    )}
                    {thread.unreadCount > 0 && (
                      <Badge className="text-[10px] h-5 px-1.5">
                        {thread.unreadCount}
                      </Badge>
                    )}
                    {hasMultipleEmails && (
                      isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(thread.lastEmailDate), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                  {' • '}
                  {lastEmail?.direction === 'inbound' ? 'Reçu' : 'Envoyé'}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {thread.emails.map((email, idx) => (
                  <EmailMessage
                    key={email.id}
                    email={email}
                    isLast={idx === thread.emails.length - 1}
                    onReply={onReply}
                    onFollowUp={onFollowUp}
                  />
                ))}
              </div>
            </ScrollArea>
            
            {/* Quick actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onReply(lastEmail)}
              >
                <Reply className="h-3.5 w-3.5 mr-1.5" />
                Répondre
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onFollowUp(lastEmail)}
              >
                <CornerUpRight className="h-3.5 w-3.5 mr-1.5" />
                Relancer
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
