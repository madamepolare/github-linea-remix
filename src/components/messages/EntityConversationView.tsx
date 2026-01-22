import { useNavigate } from "react-router-dom";
import { useCommunications, EntityType, getEntityTypeLabel } from "@/hooks/useCommunications";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageInput } from "@/components/messages/MessageInput";
import { 
  X, 
  ExternalLink, 
  CheckSquare, 
  FolderKanban, 
  FileText, 
  Building2, 
  User, 
  Target 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EntityConversationViewProps {
  entityKey: string; // Format: entity-{type}-{entityId}
  onClose: () => void;
  onBack?: () => void;
}

const entityIcons: Record<EntityType, typeof CheckSquare> = {
  task: CheckSquare,
  project: FolderKanban,
  tender: FileText,
  company: Building2,
  contact: User,
  lead: Target,
};

const entityRoutes: Record<EntityType, (id: string) => string> = {
  task: (id) => `/tasks/${id}`,
  project: (id) => `/projects/${id}`,
  tender: (id) => `/tenders/${id}`,
  company: (id) => `/crm/companies/${id}`,
  contact: (id) => `/crm/contacts/${id}`,
  lead: (id) => `/crm/leads/${id}`,
};

export function EntityConversationView({ entityKey, onClose, onBack }: EntityConversationViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profiles } = useWorkspaceProfiles();

  // Parse entity key
  const parts = entityKey.split("-");
  const entityType = parts[1] as EntityType;
  const entityId = parts.slice(2).join("-"); // Handle UUIDs with dashes

  const { 
    communications, 
    isLoading, 
    createCommunication 
  } = useCommunications(entityType, entityId, { includeContext: true });

  const Icon = entityIcons[entityType] || FileText;

  const getProfile = (userId: string | null) => {
    if (!userId) return null;
    return profiles?.find(p => p.user_id === userId);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSend = async (content: string, mentions: string[]) => {
    await createCommunication.mutateAsync({
      type: "comment",
      content,
      mentions,
    });
  };

  const handleOpenEntity = () => {
    const route = entityRoutes[entityType]?.(entityId);
    if (route) {
      navigate(route);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="px-2 md:px-4 py-2 md:py-3 border-b flex items-center gap-2 bg-background/95 backdrop-blur-xl sticky top-0 z-10 shrink-0">
        {/* Back button - Mobile only */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 md:hidden shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm md:text-base truncate">{getEntityTypeLabel(entityType)}</h2>
          <p className="text-xs text-muted-foreground">
            {communications?.length || 0} message(s)
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleOpenEntity} className="hidden md:flex">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir
          </Button>
          <Button variant="ghost" size="icon" onClick={handleOpenEntity} className="h-9 w-9 md:hidden">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 hidden md:flex">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {communications && communications.length > 0 ? (
            communications.map((comm) => {
              const profile = getProfile(comm.created_by);
              const isOwn = comm.created_by === user?.id;

              return (
                <div
                  key={comm.id}
                  className={cn(
                    "flex gap-3",
                    isOwn && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[70%]", isOwn && "text-right")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {profile?.full_name || "Utilisateur"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comm.created_at), "d MMM HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg",
                      isOwn 
                        ? "bg-primary/10 text-foreground" 
                        : "bg-muted"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{comm.content}</p>
                    </div>
                    {comm.source_entity_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sur: {comm.source_entity_name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Icon}
              title="Aucun message"
              description="Commencez la conversation !"
            />
          )}
        </div>
      </ScrollArea>

      {/* Input - Fixed at bottom */}
      <div className="shrink-0 p-3 md:p-4 border-t bg-background safe-area-inset-bottom">
        <MessageInput
          channelName={getEntityTypeLabel(entityType)}
          onSend={handleSend}
          isLoading={createCommunication.isPending}
          placeholder="Écrire un message..."
        />
      </div>
    </div>
  );
}
