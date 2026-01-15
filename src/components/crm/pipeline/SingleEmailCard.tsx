import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Mail, 
  Reply, 
  CornerUpRight,
  Send,
  Paperclip,
  Sparkles,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Email } from "@/hooks/useEntityEmails";

interface SingleEmailCardProps {
  email: Email;
  onReply: (email: Email) => void;
  onFollowUp: (email: Email) => void;
  onMarkAsRead?: (emailId: string) => void;
}

export function SingleEmailCard({ 
  email, 
  onReply, 
  onFollowUp,
  onMarkAsRead 
}: SingleEmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isInbound = email.direction === 'inbound';
  const isUnread = !email.is_read && isInbound;
  
  const sender = isInbound ? email.from_email : 'Moi';
  const senderInitials = isInbound 
    ? (email.from_email?.slice(0, 2).toUpperCase() || 'IN') 
    : 'ME';

  // Clean body for preview
  const cleanBody = email.body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const bodyPreview = cleanBody.length > 150 
    ? cleanBody.slice(0, 150) + '...' 
    : cleanBody;

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && isUnread && onMarkAsRead) {
      onMarkAsRead(email.id);
    }
  };

  // Render HTML body safely
  const renderBody = () => {
    if (email.body.includes('<')) {
      return (
        <div 
          className="prose prose-sm max-w-none dark:prose-invert break-words overflow-hidden"
          dangerouslySetInnerHTML={{ 
            __html: email.body
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          }} 
        />
      );
    }
    return <p className="whitespace-pre-wrap break-words">{email.body}</p>;
  };

  const emailDate = email.sent_at || email.received_at || email.created_at;

  return (
    <div className={cn(
      "relative",
      isInbound && "animate-in slide-in-from-left-2 duration-300"
    )}>
      {/* Colored left border for inbound emails */}
      {isInbound && (
        <div className="absolute -left-1 top-2 bottom-2 w-1 bg-gradient-to-b from-green-500 to-emerald-400 rounded-full" />
      )}
      
      <Card className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        isInbound 
          ? "bg-green-50/80 dark:bg-green-950/30 border-green-200 dark:border-green-800 ml-2 mr-0 shadow-sm shadow-green-100/50 dark:shadow-green-900/20" 
          : "bg-muted/30 border-border ml-0 mr-2",
        isUnread && "ring-2 ring-green-400/50"
      )}>
        <CardContent className="p-3">
          {/* Header row */}
          <div 
            className="flex items-start gap-3"
            onClick={handleExpand}
          >
            <Avatar className={cn(
              "h-9 w-9 flex-shrink-0",
              isInbound && "ring-2 ring-green-400"
            )}>
              <AvatarFallback className={cn(
                "text-xs font-medium",
                isInbound 
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                  : "bg-muted text-muted-foreground"
              )}>
                {senderInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-sm truncate",
                  isUnread ? "font-bold text-foreground" : "font-medium text-foreground"
                )}>
                  {sender}
                </span>
                
                {/* Dopamine badge for unread client responses */}
                {isUnread && (
                  <Badge className="bg-green-500 text-white animate-pulse h-5 text-[10px] px-1.5">
                    <Sparkles className="h-3 w-3 mr-0.5" />
                    Réponse client !
                  </Badge>
                )}
                
                {/* Sent badge for outbound */}
                {!isInbound && (
                  <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                    <Send className="h-2.5 w-2.5 mr-0.5" />
                    Envoyé
                  </Badge>
                )}
              </div>
              
              <p className={cn(
                "text-sm mt-0.5 truncate",
                isUnread ? "font-semibold" : "font-medium text-foreground/90"
              )}>
                {email.subject}
              </p>
              
              <p className="text-xs text-muted-foreground mt-0.5">
                {emailDate 
                  ? formatDistanceToNow(new Date(emailDate), { addSuffix: true, locale: fr })
                  : ''
                }
              </p>
            </div>

            <div className="flex items-center gap-1">
              {email.attachments && email.attachments.length > 0 && (
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Preview (when collapsed) */}
          {!isExpanded && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 break-words">
              {bodyPreview}
            </p>
          )}

          {/* Full content (when expanded) */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
              {/* Full date */}
              <p className="text-xs text-muted-foreground">
                {emailDate 
                  ? format(new Date(emailDate), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })
                  : ''
                }
              </p>
              
              {/* Recipients */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>De : {email.from_email || 'Moi'}</p>
                <p>À : {email.to_email}</p>
                {email.cc && email.cc.length > 0 && (
                  <p>Cc : {email.cc.join(', ')}</p>
                )}
              </div>

              {/* Body */}
              <div className="text-sm max-h-[300px] overflow-y-auto">
                {renderBody()}
              </div>

              {/* Attachments */}
              {email.attachments && email.attachments.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    <Paperclip className="h-3 w-3 inline mr-1" />
                    {email.attachments.length} pièce(s) jointe(s)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {email.attachments.map((att: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {att.name || `Fichier ${idx + 1}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm"
                  variant={isInbound ? "default" : "outline"}
                  className={cn(
                    "flex-1 h-8",
                    isInbound && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply(email);
                  }}
                >
                  <Reply className="h-3.5 w-3.5 mr-1" />
                  Répondre
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollowUp(email);
                  }}
                >
                  <CornerUpRight className="h-3.5 w-3.5 mr-1" />
                  Relancer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
