import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  MessageCircle,
  FileText,
  StickyNote,
  Send,
  Reply,
  ChevronDown,
  ChevronUp,
  Pin,
  Trash2,
  MoreHorizontal,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCommunications,
  Communication,
  CommunicationType,
  EntityType,
} from "@/hooks/useCommunications";
import {
  useCommunicationReactions,
  QUICK_REACTIONS,
} from "@/hooks/useCommunicationReactions";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { MentionInput, renderContentWithMentions } from "./MentionInput";

interface CompactEntityCommunicationsProps {
  entityType: EntityType;
  entityId: string | null;
  className?: string;
}

const typeConfig: Record<
  CommunicationType,
  { icon: typeof MessageCircle; label: string; color: string }
> = {
  comment: {
    icon: MessageCircle,
    label: "Commentaire",
    color: "text-blue-600 dark:text-blue-400",
  },
  exchange: {
    icon: FileText,
    label: "Échange",
    color: "text-purple-600 dark:text-purple-400",
  },
  email_sent: {
    icon: Send,
    label: "Email envoyé",
    color: "text-green-600 dark:text-green-400",
  },
  email_received: {
    icon: MessageCircle,
    label: "Email reçu",
    color: "text-amber-600 dark:text-amber-400",
  },
  note: {
    icon: StickyNote,
    label: "Note",
    color: "text-yellow-700 dark:text-yellow-400",
  },
};

export function CompactEntityCommunications({
  entityType,
  entityId,
  className,
}: CompactEntityCommunicationsProps) {
  const { user } = useAuth();
  const {
    rootCommunications,
    repliesMap,
    isLoading,
    createCommunication,
    deleteCommunication,
    togglePin,
  } = useCommunications(entityType, entityId);
  const { data: profiles } = useWorkspaceProfiles();

  const allCommIds = useMemo(() => {
    if (!rootCommunications) return [];
    const ids = [...rootCommunications.map((c) => c.id)];
    rootCommunications.forEach((c) => {
      const replies = repliesMap.get(c.id) || [];
      replies.forEach((r) => ids.push(r.id));
    });
    return ids;
  }, [rootCommunications, repliesMap]);

  const { reactionsByComm, toggleReaction } = useCommunicationReactions(allCommIds);

  const [newContent, setNewContent] = useState("");
  const [newMentions, setNewMentions] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyMentions, setReplyMentions] = useState<string[]>([]);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!rootCommunications) return;
    setExpandedThreads((prev) => {
      const next = prev.size === 0 ? new Set<string>() : new Set(prev);
      rootCommunications.forEach((c) => {
        const replies = repliesMap.get(c.id) || [];
        if (replies.length > 0) next.add(c.id);
      });
      return next;
    });
  }, [rootCommunications, repliesMap]);

  const getProfile = (userId: string | null) => {
    if (!userId) return null;
    return profiles?.find((p) => p.user_id === userId);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (userId: string | null) => {
    if (!userId) return "bg-muted";
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
      "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
    ];
    const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const handleSubmit = () => {
    if (!newContent.trim()) return;
    createCommunication.mutate(
      {
        type: "comment",
        content: newContent,
        mentions: newMentions.length > 0 ? newMentions : undefined,
      },
      {
        onSuccess: () => {
          setNewContent("");
          setNewMentions([]);
        },
      }
    );
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    const parentComm = rootCommunications?.find((c) => c.id === parentId);
    createCommunication.mutate(
      {
        type: parentComm?.communication_type || "comment",
        content: replyContent,
        parentId,
        mentions: replyMentions.length > 0 ? replyMentions : undefined,
      },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyMentions([]);
          setReplyTo(null);
          setExpandedThreads((prev) => new Set([...prev, parentId]));
        },
      }
    );
  };

  const toggleThread = (id: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedCommunications = useMemo(() => {
    if (!rootCommunications) return [];
    return [...rootCommunications].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [rootCommunications]);

  const renderCommunication = (comm: Communication, isReply = false) => {
    const config = typeConfig[comm.communication_type];
    const Icon = config.icon;
    const profile = getProfile(comm.created_by);
    const replies = repliesMap.get(comm.id) || [];
    const isExpanded = expandedThreads.has(comm.id);
    const isOwner = comm.created_by === user?.id;
    const reactions = reactionsByComm(comm.id);

    const timeAgo = formatDistanceToNow(new Date(comm.created_at), {
      addSuffix: true,
      locale: fr,
    });

    return (
      <motion.div
        key={comm.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className={cn("group", isReply && "ml-8 mt-2")}
      >
        <div className="flex gap-2">
          <Avatar className={cn("shrink-0", isReply ? "h-6 w-6" : "h-8 w-8")}>
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
            )}
            <AvatarFallback
              className={cn(
                "text-white font-medium",
                getAvatarColor(comm.created_by),
                isReply ? "text-[10px]" : "text-xs"
              )}
            >
              {getInitials(profile?.full_name || null)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-xs text-foreground">
                {profile?.full_name || "Utilisateur"}
              </span>

              {comm.is_pinned && (
                <Pin className="h-3 w-3 text-primary fill-primary" />
              )}

              <span className="text-[10px] text-muted-foreground ml-auto">
                {timeAgo}
              </span>
            </div>

            <div
              className={cn(
                "text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mt-0.5",
                comm.communication_type === "note" && "italic text-yellow-700 dark:text-yellow-400"
              )}
            >
              {renderContentWithMentions(comm.content, profiles || [])}
            </div>

            {reactions.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {reactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() => toggleReaction.mutate({ communicationId: comm.id, emoji: r.emoji })}
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-all border",
                      r.hasReacted
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/50 border-transparent hover:border-border"
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-medium">{r.count}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                    <Smile className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1.5" align="start">
                  <div className="flex gap-0.5">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction.mutate({ communicationId: comm.id, emoji })}
                        className="text-base hover:scale-110 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px] gap-0.5 text-muted-foreground"
                  onClick={() => setReplyTo(replyTo === comm.id ? null : comm.id)}
                >
                  <Reply className="h-3 w-3" />
                </Button>
              )}

              {replies.length > 0 && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px] gap-0.5 text-muted-foreground"
                  onClick={() => toggleThread(comm.id)}
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {replies.length}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => togglePin.mutate({ id: comm.id, is_pinned: !comm.is_pinned })}
                    className="text-xs"
                  >
                    <Pin className="h-3.5 w-3.5 mr-2" />
                    {comm.is_pinned ? "Désépingler" : "Épingler"}
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem
                      className="text-destructive text-xs"
                      onClick={() => deleteCommunication.mutate(comm.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <AnimatePresence>
              {replyTo === comm.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <div className="flex gap-2 items-start">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className={cn("text-white text-[10px] font-medium", getAvatarColor(user?.id || null))}>
                        {getInitials(profiles?.find((p) => p.user_id === user?.id)?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-1.5 items-start">
                      <div className="flex-1">
                        <MentionInput
                          placeholder="Répondre..."
                          value={replyContent}
                          onChange={(value, mentions) => {
                            setReplyContent(value);
                            setReplyMentions(mentions);
                          }}
                          minHeight="40px"
                          autoFocus
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleReply(comm.id)}
                        disabled={!replyContent.trim() || createCommunication.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1"
            >
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-2 w-px bg-border" />
                <div className="space-y-2 pt-1">
                  {replies.map((reply) => renderCommunication(reply, true))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (!entityId) return null;

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-4 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentProfile = profiles?.find((p) => p.user_id === user?.id);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Input area - fixed at top */}
      <div className="p-4 border-b bg-background">
        <div className="flex gap-2 items-start">
          <Avatar className="h-8 w-8 shrink-0">
            {currentProfile?.avatar_url && (
              <AvatarImage src={currentProfile.avatar_url} alt={currentProfile.full_name || ""} />
            )}
            <AvatarFallback className={cn("text-white text-xs font-medium", getAvatarColor(user?.id || null))}>
              {getInitials(currentProfile?.full_name || null)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <MentionInput
              placeholder="Ajouter un commentaire..."
              value={newContent}
              onChange={(value, mentions) => {
                setNewContent(value);
                setNewMentions(mentions);
              }}
              minHeight="60px"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-muted-foreground">
            @ pour mentionner
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newContent.trim() || createCommunication.isPending}
            className="h-8 gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Envoyer
          </Button>
        </div>
      </div>

      {/* Communications list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sortedCommunications.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 mb-3">
                <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Aucune communication
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Commencez la conversation en ajoutant un commentaire
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedCommunications.map((comm) => renderCommunication(comm))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
