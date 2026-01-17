import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Download, ExternalLink, FileText, Image as ImageIcon, MessageSquare, MoreHorizontal, Pencil, Smile, Trash2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { TeamMessage, useMessageReactions, useTeamMessageMutations, QUICK_REACTIONS } from "@/hooks/useTeamMessages";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { renderContentWithMentions } from "@/components/shared/MentionInput";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";

interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface MessageItemProps {
  message: TeamMessage;
  showAuthor: boolean;
  onOpenThread: () => void;
  isThreadMessage?: boolean;
}

export function MessageItem({ message, showAuthor, onOpenThread, isThreadMessage = false }: MessageItemProps) {
  const { user } = useAuth();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { toggleReaction, deleteMessage, updateMessage } = useTeamMessageMutations();
  const { data: reactions } = useMessageReactions([message.id]);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isOwn = message.created_by === user?.id;
  const showActions = isHovered || isDropdownOpen;
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

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await updateMessage.mutateAsync({
      id: message.id,
      content: editContent,
      channel_id: message.channel_id,
    });
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

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

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim()}>
                <Check className="h-4 w-4 mr-1" />
                Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <span className="text-xs text-muted-foreground">
                Échap pour annuler • Entrée pour enregistrer
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm">
              {renderContentWithMentions(message.content, profiles)}
            </div>
            
            {/* Attachments */}
            {message.attachments && (message.attachments as Attachment[]).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(message.attachments as Attachment[]).map((attachment, index) => {
                  const isImage = attachment.type.startsWith('image/');
                  
                  if (isImage) {
                    return (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative group rounded-lg overflow-hidden border bg-muted/30 hover:border-primary/50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img 
                          src={attachment.url} 
                          alt={attachment.name}
                          className="max-w-[200px] max-h-[150px] object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <ExternalLink className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </a>
                    );
                  }
                  
                  return (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium truncate max-w-[150px]">{attachment.name}</span>
                        <span className="text-2xs text-muted-foreground">
                          {attachment.size < 1024 * 1024 
                            ? `${(attachment.size / 1024).toFixed(1)} Ko`
                            : `${(attachment.size / (1024 * 1024)).toFixed(1)} Mo`
                          }
                        </span>
                      </div>
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        {!isEditing && Object.keys(reactionGroups).length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction.mutate({ message_id: message.id, emoji })}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                  "border hover:bg-muted",
                  data.hasOwn
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/50 border-border"
                )}
              >
                <span>{emoji}</span>
                <span className="font-medium">{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator - only show when reply_count > 0 */}
        {!isEditing && !isThreadMessage && typeof message.reply_count === 'number' && message.reply_count > 0 && (
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
      {showActions && !isEditing && (
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
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setIsDropdownOpen(false);
                  handleStartEdit();
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    deleteMessage.mutate({ id: message.id, channel_id: message.channel_id });
                  }}
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
