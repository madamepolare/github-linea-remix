import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Reply, 
  CornerUpRight,
  Paperclip,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquareReply,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Email } from "@/hooks/useEntityEmails";

interface SingleEmailCardProps {
  email: Email;
  onReply: (email: Email) => void;
  onFollowUp: (email: Email) => void;
  onMarkAsRead?: (emailId: string) => void;
  onDelete?: (emailId: string) => void;
}

export function SingleEmailCard({ 
  email, 
  onReply, 
  onFollowUp,
  onMarkAsRead,
  onDelete
}: SingleEmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isInbound = email.direction === 'inbound';
  const isUnread = !email.is_read && isInbound;
  
  // Detect if this is a reply based on subject
  const isReply = email.subject?.toLowerCase().startsWith('re:') || 
                  email.subject?.toLowerCase().startsWith('rép:') ||
                  email.subject?.toLowerCase().startsWith('tr:');
  
  const sender = isInbound ? email.from_email : 'Moi';
  const senderInitials = isInbound 
    ? (email.from_email?.slice(0, 2).toUpperCase() || 'IN') 
    : 'ME';

  // Clean body for preview - strip quoted content for cleaner preview
  const cleanBody = email.body
    .replace(/<[^>]+>/g, ' ')
    .replace(/On .+ wrote:/gi, '') // Remove quote headers
    .replace(/Le .+ a écrit :/gi, '')
    .replace(/>.+/g, '') // Remove quoted lines
    .replace(/\s+/g, ' ')
    .trim();
  
  const bodyPreview = cleanBody.length > 100 
    ? cleanBody.slice(0, 100) + '...' 
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
          className="prose prose-sm max-w-none dark:prose-invert break-words"
          dangerouslySetInnerHTML={{ 
            __html: email.body
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          }} 
        />
      );
    }
    return <p className="whitespace-pre-wrap break-words text-sm">{email.body}</p>;
  };

  const emailDate = email.sent_at || email.received_at || email.created_at;

  return (
    <div 
      className={cn(
        "group relative rounded-lg border transition-all cursor-pointer",
        isInbound 
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300" 
          : "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300",
        isUnread && "ring-1 ring-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30"
      )}
      onClick={handleExpand}
    >
      <div className="p-3 space-y-2">
        {/* Top row: Direction + Reply indicator + Time + Delete */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Direction badge */}
            <Badge 
              variant="secondary" 
              className={cn(
                "h-5 text-[10px] font-medium gap-1 px-1.5",
                isInbound 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300" 
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {isInbound ? (
                <ArrowDownLeft className="h-3 w-3" />
              ) : (
                <ArrowUpRight className="h-3 w-3" />
              )}
              {isInbound ? "Reçu" : "Envoyé"}
            </Badge>
            
            {/* Reply indicator */}
            {isReply && (
              <Badge 
                variant="outline" 
                className="h-5 text-[10px] gap-1 px-1.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
              >
                <MessageSquareReply className="h-3 w-3" />
                Réponse
              </Badge>
            )}
            
            {/* Unread badge */}
            {isUnread && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground shrink-0">
              {emailDate 
                ? formatDistanceToNow(new Date(emailDate), { addSuffix: true, locale: fr })
                : ''
              }
            </span>
            
            {/* Delete button */}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(email.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Sender + Subject row */}
        <div className="flex items-start gap-2.5">
          <Avatar className={cn(
            "h-8 w-8 shrink-0 border-2",
            isInbound 
              ? "border-emerald-300 dark:border-emerald-700" 
              : "border-slate-300 dark:border-slate-600"
          )}>
            <AvatarFallback className={cn(
              "text-xs font-semibold",
              isInbound 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" 
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}>
              {senderInitials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className={cn(
              "text-sm truncate",
              isUnread ? "font-semibold" : "font-medium text-foreground/90"
            )}>
              {sender}
            </p>
            
            <p className={cn(
              "text-sm line-clamp-1",
              isUnread ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {email.subject}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {email.attachments && email.attachments.length > 0 && (
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )} />
          </div>
        </div>

        {/* Preview (when collapsed) */}
        {!isExpanded && bodyPreview && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-10">
            {bodyPreview}
          </p>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-2 pt-3 border-t border-border/40 space-y-3">
            {/* Date */}
            <p className="text-xs text-muted-foreground">
              {emailDate 
                ? format(new Date(emailDate), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                : ''
              }
            </p>
            
            {/* Recipients */}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="truncate"><span className="font-medium">De :</span> {email.from_email || 'Moi'}</p>
              <p className="truncate"><span className="font-medium">À :</span> {email.to_email}</p>
              {email.cc && email.cc.length > 0 && (
                <p className="truncate"><span className="font-medium">Cc :</span> {email.cc.join(', ')}</p>
              )}
            </div>

            {/* Body */}
            <div className="text-sm max-h-[250px] overflow-y-auto pr-1">
              {renderBody()}
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {email.attachments.length} pièce(s) jointe(s)
                </p>
                <div className="flex flex-wrap gap-1">
                  {email.attachments.map((att: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-[10px] truncate max-w-[140px]">
                      {att.name || `Fichier ${idx + 1}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button 
                size="sm"
                variant={isInbound ? "default" : "outline"}
                className={cn(
                  "flex-1 h-8 text-xs",
                  isInbound && "bg-emerald-600 hover:bg-emerald-700"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(email);
                }}
              >
                <Reply className="h-3.5 w-3.5 mr-1.5" />
                Répondre
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowUp(email);
                }}
              >
                <CornerUpRight className="h-3.5 w-3.5 mr-1.5" />
                Relancer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
