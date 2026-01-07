import { useState, useMemo } from "react";
import { useTaskComments, TaskComment } from "@/hooks/useTaskComments";
import { useTaskExchanges, TaskExchange } from "@/hooks/useTaskExchanges";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { MentionInput } from "./MentionInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, MessageSquare, Send, ArrowRightLeft, Reply, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface TaskCommunicationsProps {
  taskId: string;
}

type CommunicationType = "comment" | "exchange";

interface UnifiedCommunication {
  id: string;
  type: CommunicationType;
  title?: string | null;
  content: string;
  author_id: string | null;
  parent_id: string | null;
  created_at: string | null;
  replies?: UnifiedCommunication[];
}

export function TaskCommunications({ taskId }: TaskCommunicationsProps) {
  const { comments, createComment } = useTaskComments(taskId);
  const { exchanges, createExchange } = useTaskExchanges(taskId);
  const { data: profiles } = useWorkspaceProfiles();

  const [newContent, setNewContent] = useState("");
  const [exchangeTitle, setExchangeTitle] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [createType, setCreateType] = useState<CommunicationType>("comment");
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; type: CommunicationType; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Merge and organize communications with threads
  const { rootCommunications, repliesMap } = useMemo(() => {
    const unified: UnifiedCommunication[] = [];
    const repliesMap = new Map<string, UnifiedCommunication[]>();

    comments?.forEach((c) => {
      const comm: UnifiedCommunication = {
        id: c.id,
        type: "comment",
        content: c.content,
        author_id: c.author_id,
        parent_id: c.parent_id,
        created_at: c.created_at,
      };
      unified.push(comm);
    });

    exchanges?.forEach((e) => {
      const comm: UnifiedCommunication = {
        id: e.id,
        type: "exchange",
        title: e.title,
        content: e.content,
        author_id: e.created_by,
        parent_id: e.parent_id,
        created_at: e.created_at,
      };
      unified.push(comm);
    });

    // Separate root communications and replies
    const roots: UnifiedCommunication[] = [];
    
    unified.forEach((comm) => {
      if (comm.parent_id) {
        const existing = repliesMap.get(comm.parent_id) || [];
        existing.push(comm);
        repliesMap.set(comm.parent_id, existing);
      } else {
        roots.push(comm);
      }
    });

    // Sort roots by date (most recent first)
    roots.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    // Sort replies by date (oldest first within thread)
    repliesMap.forEach((replies) => {
      replies.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
    });

    return { rootCommunications: roots, repliesMap };
  }, [comments, exchanges]);

  const getProfile = (authorId: string | null) => {
    if (!authorId || !profiles) return null;
    return profiles.find((p) => p.user_id === authorId || p.id === authorId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = () => {
    if (!newContent.trim()) return;

    if (createType === "comment") {
      createComment.mutate({ content: newContent });
    } else {
      createExchange.mutate({
        title: exchangeTitle || "Échange",
        content: newContent,
      });
      setExchangeTitle("");
    }

    setNewContent("");
    setMentions([]);
  };

  const handleReply = () => {
    if (!replyContent.trim() || !replyingTo) return;

    if (replyingTo.type === "comment") {
      createComment.mutate({ content: replyContent, parentId: replyingTo.id });
    } else {
      createExchange.mutate({
        title: "Réponse",
        content: replyContent,
        parentId: replyingTo.id,
      });
    }

    setReplyContent("");
    setReplyingTo(null);
    
    // Auto-expand the thread we just replied to
    setExpandedThreads(prev => new Set([...prev, replyingTo.id]));
  };

  const toggleThread = (commId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commId)) {
        newSet.delete(commId);
      } else {
        newSet.add(commId);
      }
      return newSet;
    });
  };

  const formatContent = (content: string) => {
    return content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "@$1");
  };

  const startReply = (comm: UnifiedCommunication) => {
    const profile = getProfile(comm.author_id);
    setReplyingTo({
      id: comm.id,
      type: comm.type,
      authorName: profile?.full_name || "Utilisateur",
    });
    setReplyContent("");
  };

  const renderCommunication = (comm: UnifiedCommunication, isReply = false) => {
    const profile = getProfile(comm.author_id);
    const isExchange = comm.type === "exchange";
    const replies = repliesMap.get(comm.id) || [];
    const hasReplies = replies.length > 0;
    const isExpanded = expandedThreads.has(comm.id);

    return (
      <motion.div
        key={comm.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(isReply && "ml-10 border-l-2 border-muted pl-3")}
      >
        {isExchange ? (
          <Card className={cn(
            "p-3 border-l-4 border-l-primary/60 bg-primary/5",
            isReply && "border-l-2"
          )}>
            <div className="flex items-start gap-3">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {profile?.full_name ? getInitials(profile.full_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="h-3 w-3 text-primary" />
                  <span className="font-medium text-sm truncate">
                    {comm.title || "Échange"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {formatContent(comm.content)}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {profile?.full_name || "Utilisateur"} • {comm.created_at && format(new Date(comm.created_at), "d MMM à HH:mm", { locale: fr })}
                  </span>
                  {!isReply && (
                    <button
                      onClick={() => startReply(comm)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Reply className="h-3 w-3" />
                      Répondre
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex items-start gap-3">
            <Avatar className={cn("shrink-0", isReply ? "h-6 w-6" : "h-7 w-7")}>
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {profile?.full_name ? getInitials(profile.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "p-3 rounded-2xl rounded-tl-md bg-muted/60",
                  isReply && "py-2"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-xs">
                    {profile?.full_name || "Utilisateur"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {comm.created_at && format(new Date(comm.created_at), "d MMM à HH:mm", { locale: fr })}
                  </span>
                </div>
                <p className={cn("whitespace-pre-wrap", isReply ? "text-xs" : "text-sm")}>
                  {formatContent(comm.content)}
                </p>
              </div>
              {!isReply && (
                <button
                  onClick={() => startReply(comm)}
                  className="flex items-center gap-1 mt-1 ml-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Répondre
                </button>
              )}
            </div>
          </div>
        )}

        {/* Thread toggle and replies */}
        {!isReply && hasReplies && (
          <div className="mt-2">
            <button
              onClick={() => toggleThread(comm.id)}
              className="flex items-center gap-1 ml-10 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Masquer {replies.length} réponse{replies.length > 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Voir {replies.length} réponse{replies.length > 1 ? "s" : ""}
                </>
              )}
            </button>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-2"
                >
                  {replies.map((reply) => renderCommunication(reply, true))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Reply input (when replying) */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-3 border-b mb-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Reply className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  Réponse à <span className="font-medium text-foreground">{replyingTo.authorName}</span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Votre réponse..."
                className="flex-1 h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create new communication */}
      {!replyingTo && (
        <div className="space-y-3 pb-4 border-b">
          <Tabs
            value={createType}
            onValueChange={(v) => setCreateType(v as CommunicationType)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="comment" className="text-xs gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                Commentaire
              </TabsTrigger>
              <TabsTrigger value="exchange" className="text-xs gap-1.5">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Échange
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {createType === "exchange" && (
            <Input
              value={exchangeTitle}
              onChange={(e) => setExchangeTitle(e.target.value)}
              placeholder="Titre de l'échange..."
              className="h-9"
            />
          )}

          <div className="flex gap-2">
            <MentionInput
              value={newContent}
              onChange={setNewContent}
              onMentionsChange={setMentions}
              placeholder={
                createType === "comment"
                  ? "Ajouter un commentaire... @ pour mentionner"
                  : "Contenu de l'échange..."
              }
              rows={2}
              className="flex-1"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!newContent.trim()}
            size="sm"
            className="w-full"
          >
            <Send className="h-3.5 w-3.5 mr-2" />
            {createType === "comment" ? "Commenter" : "Créer l'échange"}
          </Button>
        </div>
      )}

      {/* Communications timeline */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {rootCommunications.map((comm) => renderCommunication(comm))}
        </AnimatePresence>

        {rootCommunications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Aucune communication</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Ajoutez un commentaire ou créez un échange
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function useTaskCommunicationsCount(taskId: string | null) {
  const { comments } = useTaskComments(taskId);
  const { exchanges } = useTaskExchanges(taskId);
  return (comments?.length || 0) + (exchanges?.length || 0);
}
