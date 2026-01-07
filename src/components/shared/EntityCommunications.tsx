import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
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
  ChevronRight,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCommunications,
  Communication,
  CommunicationType,
  EntityType,
  getEntityTypeLabel,
} from "@/hooks/useCommunications";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";

interface EntityCommunicationsProps {
  entityType: EntityType;
  entityId: string | null;
  className?: string;
}

const typeConfig: Record<CommunicationType, { icon: typeof MessageCircle; label: string; color: string }> = {
  comment: { icon: MessageCircle, label: "Commentaire", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  exchange: { icon: FileText, label: "Échange", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  email_sent: { icon: Mail, label: "Email envoyé", color: "bg-green-500/10 text-green-600 border-green-200" },
  email_received: { icon: MailOpen, label: "Email reçu", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  note: { icon: StickyNote, label: "Note", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
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
    task: `/tasks`, // Tasks don't have individual pages, handled differently
    project: `/projects/${entityId}`,
    lead: `/crm/leads/${entityId}`,
    company: `/crm/companies/${entityId}`,
    contact: `/crm/contacts/${entityId}`,
    tender: `/tenders/${entityId}`,
  };
  return routes[entityType];
}

export function EntityCommunications({ entityType, entityId, className }: EntityCommunicationsProps) {
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


  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [createType, setCreateType] = useState<"comment" | "exchange" | "note">("comment");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  // Initialize with all thread IDs expanded by default
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  // Default: threads ouverts. On ne réinitialise pas un choix utilisateur,
  // on initialise seulement au premier chargement puis on ajoute les nouveaux threads.
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

    const parentComm = rootCommunications.find((c) => c.id === parentId);

    // If the parent comm comes from another entity (e.g. a Task), reply on that entity,
    // while keeping the current entity as context so it stays visible here.
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
        contextEntityId: needsContext ? (entityId || undefined) : undefined,
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

  // Sort by pinned first, then by date
  const sortedCommunications = useMemo(() => {
    if (!rootCommunications) return [];
    return [...rootCommunications].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [rootCommunications]);

  const renderCommunication = (comm: Communication, isReply = false) => {
    const config = typeConfig[comm.communication_type];
    const Icon = config.icon;
    const profile = getProfile(comm.created_by);
    const replies = repliesMap.get(comm.id) || [];
    const isExpanded = expandedThreads.has(comm.id);
    const isOwner = comm.created_by === user?.id;
    
    // Check if this communication comes from a different entity (child entity)
    const isFromChildEntity = comm.entity_type !== entityType || comm.entity_id !== entityId;
    const SourceIcon = isFromChildEntity ? entityIcons[comm.entity_type] : null;

    return (
      <motion.div
        key={comm.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn("group", isReply && "ml-8 mt-2")}
      >
        <div
          className={cn(
            "rounded-lg border p-3 transition-all",
            comm.is_pinned && "ring-2 ring-primary/20",
            comm.communication_type === "comment" && "bg-card border-border",
            comm.communication_type === "exchange" && "bg-purple-500/5 border-purple-200 dark:border-purple-800",
            comm.communication_type === "note" && "bg-yellow-500/5 border-yellow-200 dark:border-yellow-700",
            comm.communication_type === "email_sent" && "bg-green-500/5 border-green-200 dark:border-green-800",
            comm.communication_type === "email_received" && "bg-amber-500/5 border-amber-200 dark:border-amber-800"
          )}
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10">
                {getInitials(profile?.full_name || null)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">
                  {profile?.full_name || "Utilisateur"}
                </span>
                <Badge variant="outline" className={cn("text-xs gap-1", config.color)}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
                {comm.is_pinned && (
                  <Pin className="h-3 w-3 text-primary fill-primary" />
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(comm.created_at), "d MMM à HH:mm", { locale: fr })}
                </span>
              </div>

              {/* Source indicator for communications from child entities */}
              {isFromChildEntity && SourceIcon && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <SourceIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    depuis {getEntityTypeLabel(comm.entity_type).toLowerCase()}
                  </span>
                  {comm.entity_type !== 'task' && (
                    <Link
                      to={getEntityLink(comm.entity_type, comm.entity_id)}
                      className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                      Voir <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              )}

              {comm.title && (
                <h4 className="font-medium text-sm mt-1">{comm.title}</h4>
              )}

              <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                {comm.content}
              </p>

              <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setReplyTo(replyTo === comm.id ? null : comm.id)}
                  >
                    <Reply className="h-3 w-3" />
                    Répondre
                  </Button>
                )}

                {replies.length > 0 && !isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleThread(comm.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {replies.length} réponse{replies.length > 1 ? "s" : ""}
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        togglePin.mutate({ id: comm.id, is_pinned: !comm.is_pinned })
                      }
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {comm.is_pinned ? "Désépingler" : "Épingler"}
                    </DropdownMenuItem>
                    {isOwner && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteCommunication.mutate(comm.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {replyTo === comm.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 ml-11"
              >
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Votre réponse..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleReply(comm.id)}
                    disabled={!replyContent.trim() || createCommunication.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Replies */}
        <AnimatePresence>
          {isExpanded && replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {replies.map((reply) => renderCommunication(reply, true))}
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
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Create new communication */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Tabs
          value={createType}
          onValueChange={(v) => setCreateType(v as typeof createType)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="comment" className="text-xs gap-1">
              <MessageCircle className="h-3 w-3" />
              Commentaire
            </TabsTrigger>
            <TabsTrigger value="exchange" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              Échange
            </TabsTrigger>
            <TabsTrigger value="note" className="text-xs gap-1">
              <StickyNote className="h-3 w-3" />
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
              : "Ajouter une note..."
          }
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[80px] text-sm"
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

      {/* Communications list */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedCommunications.map((comm) => renderCommunication(comm))}
        </AnimatePresence>

        {sortedCommunications.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune communication pour le moment</p>
            <p className="text-xs mt-1">
              Commencez par ajouter un commentaire, un échange ou une note
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
