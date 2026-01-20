import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, ChevronDown, ChevronUp, Download, ExternalLink, FileText, Image as ImageIcon, MessageSquare, MoreHorizontal, Pencil, Reply, Send, Smile, Trash2, X } from "lucide-react";
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
import { TeamMessage, useMessageReactions, useTeamMessageMutations, useThreadMessages, QUICK_REACTIONS } from "@/hooks/useTeamMessages";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { renderContentWithMentions, MentionInput } from "@/components/shared/MentionInput";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { motion, AnimatePresence } from "framer-motion";

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
  onReply?: () => void;
  showInlineReplies?: boolean;
}

export function MessageItem({ message, showAuthor, onOpenThread, isThreadMessage = false, onReply, showInlineReplies = true }: MessageItemProps) {
  const { user } = useAuth();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { toggleReaction, deleteMessage, updateMessage, createMessage } = useTeamMessageMutations();
  const { data: reactions } = useMessageReactions([message.id]);
  const hasReplies = !isThreadMessage && showInlineReplies && (message.reply_count || 0) > 0;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [isThreadExpanded, setIsThreadExpanded] = useState(false);
  const [showInlineReplyInput, setShowInlineReplyInput] = useState(false);
  const [inlineReplyContent, setInlineReplyContent] = useState("");
  const [inlineReplyMentions, setInlineReplyMentions] = useState<string[]>([]);

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
    setShowMobileActions(false);
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

  const handleLongPress = () => {
    setShowMobileActions(true);
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex gap-2.5 md:gap-3 py-1.5 px-2 -mx-2 rounded-xl transition-colors touch-manipulation",
          isHovered && "bg-muted/50",
          showMobileActions && "bg-muted/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={(e) => {
          const timer = setTimeout(handleLongPress, 500);
          const handleTouchEnd = () => {
            clearTimeout(timer);
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        {/* Avatar or spacer */}
        <div className="w-8 md:w-9 flex-shrink-0">
          {showAuthor && (
            <Avatar className="h-8 w-8 md:h-9 md:w-9">
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
                className="min-h-[60px] resize-none text-base"
                autoFocus
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim()}>
                  <Check className="h-4 w-4 mr-1" />
                  Enregistrer
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm leading-relaxed break-words">
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
                          className="block relative group/img rounded-xl overflow-hidden border bg-muted/30 hover:border-primary/50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            className="max-w-[240px] md:max-w-[280px] max-h-[180px] object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
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
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate max-w-[120px] md:max-w-[150px]">{attachment.name}</span>
                          <span className="text-[10px] text-muted-foreground">
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
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {Object.entries(reactionGroups).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction.mutate({ message_id: message.id, emoji })}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all active:scale-95 touch-manipulation",
                    "border hover:bg-muted",
                    data.hasOwn
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/50 border-border"
                  )}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="font-medium">{data.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Thread indicator - click to expand inline */}
          {!isEditing && !isThreadMessage && typeof message.reply_count === 'number' && message.reply_count > 0 && (
            <button
              onClick={() => setIsThreadExpanded(!isThreadExpanded)}
              className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline active:opacity-70 touch-manipulation"
            >
              {isThreadExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {message.reply_count} réponse{message.reply_count > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Desktop Actions (hover) */}
        {showActions && !isEditing && (
          <div className="absolute right-2 top-0 hidden md:flex items-center gap-0.5 bg-background border rounded-lg shadow-sm p-0.5">
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

            {!isThreadMessage && onReply && (
              <Button variant="ghost" size="icon-xs" onClick={onReply} title="Répondre">
                <Reply className="h-4 w-4" />
              </Button>
            )}

            {!isThreadMessage && (
              <Button variant="ghost" size="icon-xs" onClick={onOpenThread} title="Ouvrir le fil">
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

      {/* Mobile Action Sheet */}
      {showMobileActions && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowMobileActions(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div 
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-4 pb-8 safe-area-inset-bottom animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Reactions */}
            <div className="flex justify-center gap-2 mb-4">
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    toggleReaction.mutate({ message_id: message.id, emoji });
                    setShowMobileActions(false);
                  }}
                  className="p-3 hover:bg-muted rounded-xl transition-colors text-2xl active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <div className="space-y-1">
              {!isThreadMessage && onReply && (
                <button
                  onClick={() => {
                    onReply();
                    setShowMobileActions(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <Reply className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Répondre</span>
                </button>
              )}
              
              {!isThreadMessage && (
                <button
                  onClick={() => {
                    onOpenThread();
                    setShowMobileActions(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Ouvrir le fil</span>
                </button>
              )}
              
              {isOwn && (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <Pencil className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Modifier</span>
                  </button>
                  <button
                    onClick={() => {
                      deleteMessage.mutate({ id: message.id, channel_id: message.channel_id });
                      setShowMobileActions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left text-destructive"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="font-medium">Supprimer</span>
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowMobileActions(false)}
              className="w-full mt-4 py-3 rounded-xl bg-muted font-medium text-center"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}
