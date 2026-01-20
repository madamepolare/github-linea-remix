import { ChevronUp, MoreHorizontal, Trash2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RoadmapIdea, IDEA_STATUSES, IDEA_CATEGORIES } from "@/hooks/useRoadmap";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface IdeaCardProps {
  idea: RoadmapIdea;
  onVote: (ideaId: string, remove: boolean) => void;
  onUpdateStatus?: (ideaId: string, status: string) => void;
  onDelete?: (ideaId: string) => void;
}

export function IdeaCard({ idea, onVote, onUpdateStatus, onDelete }: IdeaCardProps) {
  const { user } = useAuth();
  const { isAdmin, isOwner } = usePermissions();
  const statusConfig = IDEA_STATUSES.find(s => s.value === idea.status);
  const categoryConfig = IDEA_CATEGORIES.find(c => c.value === idea.category);

  const isOwnerOfIdea = user?.id === idea.user_id;
  const canManage = isAdmin || isOwner || isOwnerOfIdea;

  const initials = idea.author?.full_name
    ? idea.author.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
      {/* Vote button */}
      <button
        onClick={() => onVote(idea.id, !!idea.user_voted)}
        className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors shrink-0",
          idea.user_voted
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
        )}
      >
        <ChevronUp className="h-4 w-4" />
        <span className="text-xs font-semibold">{idea.votes_count}</span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground">{idea.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("text-xs", statusConfig?.color)}>
              {statusConfig?.label}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(isAdmin || isOwner) && onUpdateStatus && (
                    <>
                      {IDEA_STATUSES.map(status => (
                        <DropdownMenuItem
                          key={status.value}
                          onClick={() => onUpdateStatus(idea.id, status.value)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {status.label}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {(isOwnerOfIdea || isAdmin || isOwner) && onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(idea.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {idea.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{idea.description}</p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={idea.author?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {idea.author?.full_name || 'Utilisateur'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true, locale: fr })}
          </span>
          {categoryConfig && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <Badge variant="outline" className="text-xs py-0">
                {categoryConfig.label}
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
