import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare, MoreHorizontal, Pencil, Smile, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TeamMessage, useMessageReactions, useTeamMessageMutations, QUICK_REACTIONS } from "@/hooks/useTeamMessages";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { renderContentWithMentions } from "@/components/shared/MentionInput";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";

interface MessageItemProps {
  message: TeamMessage;
  showAuthor: boolean;
  onOpenThread: () => void;
  isThreadMessage?: boolean;
}

export function MessageItem({ message, showAuthor, onOpenThread, isThreadMessage = false }: MessageItemProps) {
  const { user } = useAuth();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { toggleReaction, deleteMessage } = useTeamMessageMutations();
  const { data: reactions } = useMessageReactions([message.id]);
  const [isHovered, setIsHovered] = useState(false);

  const isOwn = message.created_by === user?.id;
  const messageReactions = reactions?.filter(r => r.message_id === message.id) || [];
  
  // Group reactions by emoji
  const reactionGroups = messageReactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [], hasOwn: false };
    }
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.user_id);
    if (r.user_id === user?.id) acc[r.emoji].hasOwn = true;
    return acc;
  }, {} as Record<string, { count: number; users: string[]; hasOwn: boolean }>);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formattedTime = format(new Date(message.created_at), "HH:mm", { locale: fr });
  const formattedDate = format(new Date(message.created_at), "d MMM yyyy", { locale: fr });

  return (
    <div
      className={cn(
        "group relative flex gap-3 py-1 px-2 -mx-2 rounded-md transition-colors",
        isHovered && "bg-muted/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar or spacer */}
      <div className="w-9 flex-shrink-0">
        {showAuthor && (
          <Avatar className="h-9 w-9">
            <AvatarImage src={message.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(message.author?.full_name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showAuthor && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-medium text-sm">
              {message.author?.full_name || "Utilisateur"}
            </span>
            <span className="text-xs text-muted-foreground" title={formattedDate}>
              {formattedTime}
            </span>
            {message.is_edited && (
              <span className="text-xs text-muted-foreground">(modifié)</span>
            )}
          </div>
        )}

        <div className="text-sm">
          {renderContentWithMentions(message.content, profiles)}
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction.mutate({ message_id: message.id, emoji })}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border transition-colors",
                  data.hasOwn
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-transparent hover:border-border"
                )}
              >
                <span>{emoji}</span>
                <span>{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {!isThreadMessage && message.reply_count && message.reply_count > 0 && (
          <button
            onClick={onOpenThread}
            className="flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
          >
            <MessageSquare className="h-3 w-3" />
            {message.reply_count} réponse{message.reply_count > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Actions (hover) */}
      {isHovered && (
        <div className="absolute right-2 top-0 flex items-center gap-0.5 bg-background border rounded-md shadow-sm p-0.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex gap-1">
                {QUICK_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction.mutate({ message_id: message.id, emoji })}
                    className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {!isThreadMessage && (
            <Button variant="ghost" size="icon-xs" onClick={onOpenThread}>
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}

          {isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteMessage.mutate({ id: message.id, channel_id: message.channel_id })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
