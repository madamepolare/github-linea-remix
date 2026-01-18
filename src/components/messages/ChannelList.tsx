import { useState } from "react";
import { Hash, Lock, MessageCircle, Plus, CheckSquare, FolderKanban, FileText, Building2, User, Target, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TeamChannel, useUnreadCounts } from "@/hooks/useTeamMessages";
import { useEntityConversations, EntityConversation } from "@/hooks/useEntityConversations";
import { EntityType } from "@/hooks/useCommunications";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ChannelListProps {
  channels: TeamChannel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: () => void;
  onNewDirectMessage: () => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onNewDirectMessage,
}: ChannelListProps) {
  const { data: unreadCounts } = useUnreadCounts();
  const { data: entityConversations } = useEntityConversations();
  
  const publicChannels = channels.filter(c => c.channel_type === "public");
  const privateChannels = channels.filter(c => c.channel_type === "private");
  const directMessages = channels.filter(c => c.channel_type === "direct");

  const [expandedEntityTypes, setExpandedEntityTypes] = useState<Record<EntityType, boolean>>({
    task: true,
    project: true,
    tender: false,
    company: false,
    contact: false,
    lead: false,
  });

  const entityIcons: Record<EntityType, typeof CheckSquare> = {
    task: CheckSquare,
    project: FolderKanban,
    tender: FileText,
    company: Building2,
    contact: User,
    lead: Target,
  };

  const entityLabels: Record<EntityType, string> = {
    task: "Tâches",
    project: "Projets",
    tender: "Appels d'offres",
    company: "Entreprises",
    contact: "Contacts",
    lead: "Leads",
  };

  const toggleEntityType = (type: EntityType) => {
    setExpandedEntityTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Group entity conversations by type
  const groupedEntityConversations = entityConversations?.reduce((acc, conv) => {
    if (!acc[conv.entity_type]) {
      acc[conv.entity_type] = [];
    }
    acc[conv.entity_type].push(conv);
    return acc;
  }, {} as Record<EntityType, EntityConversation[]>) || {};

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderEntityConversation = (conv: EntityConversation) => {
    const isActive = conv.id === activeChannelId;
    const Icon = entityIcons[conv.entity_type] || FileText;

    return (
      <button
        key={conv.id}
        onClick={() => onSelectChannel(conv.id)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="truncate block">{conv.entity_name}</span>
          <span className="text-xs text-muted-foreground truncate block">
            {format(new Date(conv.last_message_at), "d MMM", { locale: fr })}
          </span>
        </div>
        {conv.message_count > 0 && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
            {conv.message_count}
          </Badge>
        )}
      </button>
    );
  };

  const renderChannelItem = (channel: TeamChannel) => {
    const unread = unreadCounts?.[channel.id] || 0;
    const isActive = channel.id === activeChannelId;
    const isDM = channel.channel_type === "direct";
    const dmMember = channel.dm_member;

    return (
      <button
        key={channel.id}
        onClick={() => onSelectChannel(channel.id)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        {isDM ? (
          <Avatar className="h-5 w-5">
            <AvatarImage src={dmMember?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {getInitials(dmMember?.full_name)}
            </AvatarFallback>
          </Avatar>
        ) : channel.channel_type === "private" ? (
          <Lock className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Hash className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate flex-1">
          {isDM ? (dmMember?.full_name || "Utilisateur") : channel.name}
        </span>
        {unread > 0 && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
            {unread}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Messages</h2>
          <Button variant="ghost" size="icon-sm" onClick={onCreateChannel}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Public Channels */}
          {publicChannels.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Canaux
                </span>
              </div>
              <div className="space-y-0.5">
                {publicChannels.map(renderChannelItem)}
              </div>
            </div>
          )}

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Canaux privés
                </span>
              </div>
              <div className="space-y-0.5">
                {privateChannels.map(renderChannelItem)}
              </div>
            </div>
          )}

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Messages directs
              </span>
              <Button variant="ghost" size="icon-xs" onClick={onNewDirectMessage}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-0.5">
              {directMessages.length > 0 ? (
                directMessages.map(renderChannelItem)
              ) : (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  Aucune conversation
                </p>
              )}
            </div>
          </div>

          {/* Entity Conversations by Type */}
          {Object.keys(groupedEntityConversations).length > 0 && (
            <div className="space-y-2">
              <div className="px-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fils de discussion
                </span>
              </div>
              {(Object.entries(groupedEntityConversations) as [EntityType, EntityConversation[]][]).map(([type, conversations]) => {
                const Icon = entityIcons[type];
                const isExpanded = expandedEntityTypes[type];
                
                return (
                  <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleEntityType(type)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-2 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <Icon className="h-3.5 w-3.5" />
                        <span>{entityLabels[type]}</span>
                        <Badge variant="outline" className="h-4 min-w-4 px-1 text-[10px] ml-auto">
                          {conversations.length}
                        </Badge>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-0.5 mt-0.5">
                        {conversations.map(renderEntityConversation)}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
