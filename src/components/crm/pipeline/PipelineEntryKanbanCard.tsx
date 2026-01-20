import { motion } from "framer-motion";
import { 
  Building2, 
  User, 
  Mail, 
  Calendar,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle,
  MoreHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { KanbanCard } from "@/components/shared/KanbanBoard";
import { PipelineEntry } from "@/hooks/useContactPipeline";
import { usePipelineActions } from "@/hooks/usePipelineActions";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PipelineEntryKanbanCardProps {
  entry: PipelineEntry;
  onClick: () => void;
  onRemove: () => void;
  isDragging?: boolean;
}

export function PipelineEntryKanbanCard({ 
  entry, 
  onClick, 
  onRemove,
  isDragging 
}: PipelineEntryKanbanCardProps) {
  const { activeWorkspace } = useAuth();
  const { actions, pendingCount, overdueCount } = usePipelineActions(entry.id, activeWorkspace?.id);
  
  const isContact = !!entry.contact;
  const entity = entry.contact || entry.company;
  const name = entity?.name || "Sans nom";
  const email = isContact ? entry.contact?.email : entry.company?.email;

  // Check for urgent upcoming action (within 24h)
  const urgentAction = actions.find(a => {
    if (a.status !== 'pending' || !a.due_date) return false;
    const hoursUntil = differenceInHours(new Date(a.due_date), new Date());
    return hoursUntil > 0 && hoursUntil <= 24;
  });

  // Determine alert state
  const hasOverdue = overdueCount > 0;
  const hasNoActions = pendingCount === 0;
  const hasUrgent = !!urgentAction && !hasOverdue;
  
  // Email reply indicators
  const hasUnreadReplies = (entry.unread_replies_count || 0) > 0;
  const isAwaitingResponse = entry.awaiting_response && !hasUnreadReplies;
  const hasReplied = !!entry.last_inbound_email_at && !hasUnreadReplies;
  
  // Calculate days since last email sent (for awaiting response indicator)
  const daysSinceEmail = entry.last_email_sent_at 
    ? Math.floor((Date.now() - new Date(entry.last_email_sent_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Determine accent color based on priority
  const getAccentColor = () => {
    if (hasUnreadReplies) return "hsl(142 76% 36%)"; // green
    if (hasReplied) return "hsl(142 76% 36%)"; // green
    if (hasOverdue) return "hsl(0 84% 60%)"; // red
    if (hasNoActions) return "hsl(45 93% 47%)"; // amber
    if (hasUrgent) return "hsl(24 95% 53%)"; // orange
    return undefined;
  };

  return (
    <KanbanCard onClick={onClick} accentColor={getAccentColor()}>
      <div className="space-y-2">
        {/* Entity type badge */}
        <div className="flex items-center gap-1.5">
          <Badge 
            variant="outline" 
            className={cn(
              "text-2xs px-1.5 py-0.5 gap-1 font-normal",
              isContact 
                ? "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" 
                : "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800"
            )}
          >
            {isContact ? (
              <User className="h-2.5 w-2.5" />
            ) : (
              <Building2 className="h-2.5 w-2.5" />
            )}
            <span>{isContact ? "Contact" : "Entreprise"}</span>
          </Badge>

          {/* Status badges */}
          <div className="flex items-center gap-1 ml-auto">
            <TooltipProvider delayDuration={100}>
              {/* Unread replies badge */}
              {hasUnreadReplies && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="h-5 px-1.5 gap-0.5 bg-green-600 hover:bg-green-700 animate-pulse">
                      <Mail className="h-3 w-3" />
                      <span className="text-[10px]">{entry.unread_replies_count}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {entry.unread_replies_count} réponse{(entry.unread_replies_count || 0) > 1 ? 's' : ''} non lue{(entry.unread_replies_count || 0) > 1 ? 's' : ''}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Awaiting response badge */}
              {isAwaitingResponse && daysSinceEmail > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1.5 gap-0.5 border-blue-500 text-blue-600">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{daysSinceEmail}j</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    En attente de réponse depuis {daysSinceEmail} jour{daysSinceEmail > 1 ? 's' : ''}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {hasOverdue && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="destructive" className="h-5 px-1.5 gap-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-[10px]">{overdueCount}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {overdueCount} action{overdueCount > 1 ? 's' : ''} en retard
                  </TooltipContent>
                </Tooltip>
              )}
              
              {hasNoActions && !hasOverdue && !hasUnreadReplies && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1.5 border-amber-500 text-amber-600">
                      <Clock className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Aucune action planifiée
                  </TooltipContent>
                </Tooltip>
              )}
              
              {hasUrgent && !hasOverdue && !hasNoActions && !hasUnreadReplies && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1.5 border-orange-500 text-orange-600">
                      <AlertTriangle className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Action urgente aujourd'hui
                  </TooltipContent>
                </Tooltip>
              )}

              {pendingCount > 0 && !hasOverdue && !hasUrgent && !hasUnreadReplies && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1.5 text-green-600 border-green-500">
                      <CheckCircle className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {pendingCount} action{pendingCount > 1 ? 's' : ''} planifiée{pendingCount > 1 ? 's' : ''}
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Name with avatar */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={isContact ? entry.contact?.avatar_url : entry.company?.logo_url} />
            <AvatarFallback className="text-xs font-medium">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{name}</p>
            {isContact && entry.company && (
              <p className="text-xs text-muted-foreground truncate">
                {entry.company.name}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        {email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}

        {/* Last email sent */}
        {entry.last_email_sent_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Send className="h-3 w-3 shrink-0" />
            <span>Dernier email: {format(new Date(entry.last_email_sent_at), "d MMM", { locale: fr })}</span>
          </div>
        )}
        
        {/* Notes preview */}
        {entry.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            {entry.notes}
          </p>
        )}

        {/* Footer: Entry date + Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
          {entry.entered_at && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(entry.entered_at), "d MMM yyyy", { locale: fr })}</span>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                Retirer du pipeline
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </KanbanCard>
  );
}
