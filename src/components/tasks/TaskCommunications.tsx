import { useState, useMemo } from "react";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskExchanges } from "@/hooks/useTaskExchanges";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { MentionInput } from "./MentionInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, MessageSquare, Send, ArrowRightLeft } from "lucide-react";
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
  created_at: string | null;
}

export function TaskCommunications({ taskId }: TaskCommunicationsProps) {
  const { comments, createComment } = useTaskComments(taskId);
  const { exchanges, createExchange } = useTaskExchanges(taskId);
  const { data: profiles } = useWorkspaceProfiles();

  const [newContent, setNewContent] = useState("");
  const [exchangeTitle, setExchangeTitle] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [createType, setCreateType] = useState<CommunicationType>("comment");

  // Merge and sort communications by date
  const communications = useMemo(() => {
    const unified: UnifiedCommunication[] = [];

    comments?.forEach((c) => {
      unified.push({
        id: c.id,
        type: "comment",
        content: c.content,
        author_id: c.author_id,
        created_at: c.created_at,
      });
    });

    exchanges?.forEach((e) => {
      unified.push({
        id: e.id,
        type: "exchange",
        title: e.title,
        content: e.content,
        author_id: e.created_by,
        created_at: e.created_at,
      });
    });

    return unified.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Most recent first
    });
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
      createComment.mutate(newContent);
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

  const formatContent = (content: string) => {
    // Replace mention format @[Name](id) with just @Name
    return content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "@$1");
  };

  const totalCount = (comments?.length || 0) + (exchanges?.length || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Create new communication */}
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

      {/* Communications timeline */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        <AnimatePresence mode="popLayout">
              {communications.map((comm) => {
                const profile = getProfile(comm.author_id);
            const isExchange = comm.type === "exchange";

            return (
              <motion.div
                key={comm.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {isExchange ? (
                  // Exchange card style
                  <Card className="p-3 border-l-4 border-l-primary/60 bg-primary/5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
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
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{profile?.full_name || "Utilisateur"}</span>
                          <span>•</span>
                          <span>
                            {comm.created_at &&
                              format(new Date(comm.created_at), "d MMM à HH:mm", {
                                locale: fr,
                              })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  // Comment bubble style
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "flex-1 min-w-0 p-3 rounded-2xl rounded-tl-md",
                        "bg-muted/60"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">
                          {profile?.full_name || "Utilisateur"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {comm.created_at &&
                            format(new Date(comm.created_at), "d MMM à HH:mm", {
                              locale: fr,
                            })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {formatContent(comm.content)}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {communications.length === 0 && (
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
