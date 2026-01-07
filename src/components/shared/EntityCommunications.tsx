import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  FileText,
  Mail,
  MailOpen,
  StickyNote,
  Send,
  Reply,
  ChevronDown,
  ChevronUp,
  Pin,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  ListTodo,
  FolderKanban,
  Target,
  Building2,
  User,
  FileSearch,
  Smile,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getEntityTypeLabel,
} from "@/hooks/useCommunications";
import {
  useCommunicationReactions,
  QUICK_REACTIONS,
} from "@/hooks/useCommunicationReactions";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";

interface EntityCommunicationsProps {
  entityType: EntityType;
  entityId: string | null;
  className?: string;
}

const typeConfig: Record<
  CommunicationType,
  { icon: typeof MessageCircle; label: string; color: string; bgColor: string }
> = {
  comment: {
    icon: MessageCircle,
    label: "Commentaire",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  exchange: {
    icon: FileText,
    label: "Échange",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  email_sent: {
    icon: Mail,
    label: "Email envoyé",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  email_received: {
    icon: MailOpen,
    label: "Email reçu",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  note: {
    icon: StickyNote,
    label: "Note",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
};

const entityIcons: Record<EntityType, typeof MessageCircle> = {
  task: ListTodo,
  project: FolderKanban,
  lead: Target,
  company: Building2,
  contact: User,
  tender: FileSearch,
};

function getEntityLink(entityType: EntityType, entityId: string): string {
  const routes: Record<EntityType, string> = {
    task: `/tasks`,
    project: `/projects/${entityId}`,
    lead: `/crm/leads/${entityId}`,
    company: `/crm/companies/${entityId}`,
    contact: `/crm/contacts/${entityId}`,
    tender: `/tenders/${entityId}`,
  };
  return routes[entityType];
}

export function EntityCommunications({
  entityType,
  entityId,
  className,
}: EntityCommunicationsProps) {
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

  // Get all communication IDs for reactions
  const allCommIds = useMemo(() => {
    if (!rootCommunications) return [];
    const ids = [...rootCommunications.map((c) => c.id)];
    rootCommunications.forEach((c) => {
      const replies = repliesMap.get(c.id) || [];
      replies.forEach((r) => ids.push(r.id));
    });
    return ids;
  }, [rootCommunications, repliesMap]);

  const { reactionsByComm, toggleReaction } =
    useCommunicationReactions(allCommIds);

  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [createType, setCreateType] = useState<"comment" | "exchange" | "note">(
    "comment"
  );
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand threads with replies
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
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: string | null) => {
    if (!userId) return "bg-muted";
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];
    const index =
      userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const handleSubmit = () => {
    if (!newContent.trim()) return;
    createCommunication.mutate(
      {
        type: createType,
        content: newContent,
        title: createType === "exchange" ? newTitle : undefined,
      },
      {
        onSuccess: () => {
          setNewContent("");
          setNewTitle("");
        },
      }
    );
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    const parentComm = rootCommunications?.find((c) => c.id === parentId);

    const targetEntityType = parentComm?.entity_type;
    const targetEntityId = parentComm?.entity_id;

    const needsContext =
      !!targetEntityType &&
      !!targetEntityId &&
      (targetEntityType !== entityType || targetEntityId !== entityId);

    createCommunication.mutate(
      {
        type: parentComm?.communication_type || "comment",
        content: replyContent,
        parentId,
        targetEntityType: targetEntityType || undefined,
        targetEntityId: targetEntityId || undefined,
        contextEntityType: needsContext ? entityType : undefined,
        contextEntityId: needsContext ? entityId || undefined : undefined,
      },
      {
        onSuccess: () => {
          setReplyContent("");
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

  // Sort by pinned first, then by date (newest first)
  const sortedCommunications = useMemo(() => {
    if (!rootCommunications) return [];
    return [...rootCommunications].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
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

    // Check if this communication comes from a different entity
    const isFromChildEntity =
      comm.entity_type !== entityType || comm.entity_id !== entityId;
    const SourceIcon = isFromChildEntity ? entityIcons[comm.entity_type] : null;

    const timeAgo = formatDistanceToNow(new Date(comm.created_at), {
      addSuffix: true,
      locale: fr,
    });

    return (
      <motion.div
        key={comm.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={cn("group", isReply && "ml-12 mt-3")}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            <Avatar
              className={cn(
                "ring-2 ring-background shadow-sm",
                isReply ? "h-8 w-8" : "h-10 w-10"
              )}
            >
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
              )}
              <AvatarFallback
                className={cn(
                  "text-white font-medium",
                  getAvatarColor(comm.created_by),
                  isReply ? "text-xs" : "text-sm"
                )}
              >
                {getInitials(profile?.full_name || null)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-foreground">
                {profile?.full_name || "Utilisateur"}
              </span>

              {comm.communication_type !== "comment" && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 gap-1 font-medium",
                    config.color,
                    config.bgColor
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              )}

              {comm.is_pinned && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 gap-1 bg-primary/10 text-primary"
                >
                  <Pin className="h-3 w-3 fill-current" />
                  Épinglé
                </Badge>
              )}

              {/* Source indicator */}
              {isFromChildEntity && SourceIcon && (
                <div className="flex items-center gap-1">
                  <SourceIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    via {getEntityTypeLabel(comm.entity_type).toLowerCase()}
                  </span>
                  {comm.entity_type !== "task" && (
                    <Link
                      to={getEntityLink(comm.entity_type, comm.entity_id)}
                      className="text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground ml-auto cursor-default">
                    {timeAgo}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(comm.created_at), "PPP 'à' HH:mm", {
                    locale: fr,
                  })}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Title (for exchanges) */}
            {comm.title && (
              <h4 className="font-medium text-sm mb-1">{comm.title}</h4>
            )}

            {/* Content */}
            <div
              className={cn(
                "text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed",
                comm.communication_type === "note" &&
                  "italic text-yellow-700 dark:text-yellow-400"
              )}
            >
              {comm.content}
            </div>

            {/* Reactions */}
            {reactions.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {reactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() =>
                      toggleReaction.mutate({
                        communicationId: comm.id,
                        emoji: r.emoji,
                      })
                    }
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                      "border hover:bg-muted",
                      r.hasReacted
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/50 border-border"
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-medium">{r.count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Quick reactions */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="flex gap-1">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() =>
                          toggleReaction.mutate({
                            communicationId: comm.id,
                            emoji,
                          })
                        }
                        className="text-lg hover:scale-125 transition-transform p-1"
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
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setReplyTo(replyTo === comm.id ? null : comm.id)}
                >
                  <Reply className="h-3.5 w-3.5" />
                  Répondre
                </Button>
              )}

              {replies.length > 0 && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => toggleThread(comm.id)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {replies.length} réponse{replies.length > 1 ? "s" : ""}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() =>
                      togglePin.mutate({
                        id: comm.id,
                        is_pinned: !comm.is_pinned,
                      })
                    }
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    {comm.is_pinned ? "Désépingler" : "Épingler"}
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => deleteCommunication.mutate(comm.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Reply input */}
            <AnimatePresence>
              {replyTo === comm.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="flex gap-2 items-start">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-white text-xs font-medium",
                          getAvatarColor(user?.id || null)
                        )}
                      >
                        {getInitials(
                          profiles?.find((p) => p.user_id === user?.id)
                            ?.full_name || null
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder="Écrire une réponse..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] text-sm resize-none"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comm.id)}
                        disabled={
                          !replyContent.trim() || createCommunication.isPending
                        }
                        className="shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Replies */}
        <AnimatePresence>
          {isExpanded && replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1"
            >
              <div className="relative">
                {/* Thread line */}
                <div className="absolute left-5 top-0 bottom-4 w-px bg-border" />
                <div className="space-y-3 pt-2">
                  {replies.map((reply) => renderCommunication(reply, true))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (!entityId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const currentProfile = profiles?.find((p) => p.user_id === user?.id);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Create new communication */}
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-background shadow-sm">
          {currentProfile?.avatar_url && (
            <AvatarImage src={currentProfile.avatar_url} alt={currentProfile.full_name || ""} />
          )}
          <AvatarFallback
            className={cn(
              "text-white text-sm font-medium",
              getAvatarColor(user?.id || null)
            )}
          >
            {getInitials(currentProfile?.full_name || null)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Tabs
            value={createType}
            onValueChange={(v) => setCreateType(v as typeof createType)}
          >
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger value="comment" className="text-xs gap-1.5 px-3">
                <MessageCircle className="h-3.5 w-3.5" />
                Commentaire
              </TabsTrigger>
              <TabsTrigger value="exchange" className="text-xs gap-1.5 px-3">
                <FileText className="h-3.5 w-3.5" />
                Échange
              </TabsTrigger>
              <TabsTrigger value="note" className="text-xs gap-1.5 px-3">
                <StickyNote className="h-3.5 w-3.5" />
                Note
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {createType === "exchange" && (
            <Input
              placeholder="Titre de l'échange..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-sm"
            />
          )}

          <Textarea
            placeholder={
              createType === "comment"
                ? "Ajouter un commentaire..."
                : createType === "exchange"
                ? "Contenu de l'échange..."
                : "Ajouter une note privée..."
            }
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className={cn(
              "min-h-[80px] text-sm resize-none",
              createType === "note" && "bg-yellow-50/50 dark:bg-yellow-950/20"
            )}
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newContent.trim() || createCommunication.isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </div>
      </div>

      {/* Separator */}
      {sortedCommunications.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              {sortedCommunications.length} communication
              {sortedCommunications.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Communications list */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {sortedCommunications.map((comm) => renderCommunication(comm))}
        </AnimatePresence>

        {sortedCommunications.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Aucune communication
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Commencez la conversation en ajoutant un commentaire
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
