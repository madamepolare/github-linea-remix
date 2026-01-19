import { useState } from "react";
import { motion } from "framer-motion";
import { Hash, Lock, MessageCircle, Plus, CheckSquare, FolderKanban, FileText, Building2, User, Target, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TeamChannel, useUnreadCounts } from "@/hooks/useTeamMessages";
import { useEntityConversations, EntityConversation } from "@/hooks/useEntityConversations";
import { EntityType } from "@/hooks/useCommunications";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { THIN_STROKE } from "@/components/ui/icon";

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
  const [searchQuery, setSearchQuery] = useState("");
  
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

  // Filter channels by search
  const filterChannels = (channelList: TeamChannel[]) => {
    if (!searchQuery.trim()) return channelList;
    const query = searchQuery.toLowerCase();
    return channelList.filter(c => {
      const name = c.channel_type === "direct" 
        ? c.dm_member?.full_name || "" 
        : c.name;
      return name.toLowerCase().includes(query);
    });
  };

  const filteredPublic = filterChannels(publicChannels);
  const filteredPrivate = filterChannels(privateChannels);
  const filteredDMs = filterChannels(directMessages);

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
      <motion.button
        key={conv.id}
        onClick={() => onSelectChannel(conv.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left touch-manipulation",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/50 active:bg-muted hover:text-foreground"
        )}
        whileTap={{ scale: 0.98 }}
      >
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          isActive ? "bg-primary/20" : "bg-muted"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="truncate block font-medium">{conv.entity_name}</span>
          <span className="text-xs text-muted-foreground truncate block">
            {format(new Date(conv.last_message_at), "d MMM", { locale: fr })}
          </span>
        </div>
        {conv.message_count > 0 && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs shrink-0">
            {conv.message_count}
          </Badge>
        )}
      </motion.button>
    );
  };

  const renderChannelItem = (channel: TeamChannel) => {
    const unread = unreadCounts?.[channel.id] || 0;
    const isActive = channel.id === activeChannelId;
    const isDM = channel.channel_type === "direct";
    const dmMember = channel.dm_member;

    return (
      <motion.button
        key={channel.id}
        onClick={() => onSelectChannel(channel.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left touch-manipulation",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/50 active:bg-muted hover:text-foreground"
        )}
        whileTap={{ scale: 0.98 }}
      >
        {isDM ? (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={dmMember?.avatar_url || undefined} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(dmMember?.full_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            isActive ? "bg-primary/20" : "bg-muted"
          )}>
            {channel.channel_type === "private" ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Hash className="h-4 w-4" />
            )}
          </div>
        )}
        <span className="truncate flex-1 font-medium">
          {isDM ? (dmMember?.full_name || "Utilisateur") : channel.name}
        </span>
        {unread > 0 && (
          <Badge className="h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground shrink-0">
            {unread}
          </Badge>
        )}
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search - Desktop only, mobile has it in header */}
      <div className="p-3 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 h-9 bg-muted/50 border-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Public Channels */}
          {filteredPublic.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Canaux
                </span>
              </div>
              <div className="space-y-0.5">
                {filteredPublic.map(renderChannelItem)}
              </div>
            </div>
          )}

          {/* Private Channels */}
          {filteredPrivate.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Canaux privés
                </span>
              </div>
              <div className="space-y-0.5">
                {filteredPrivate.map(renderChannelItem)}
              </div>
            </div>
          )}

          {/* Direct Messages */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Messages directs
              </span>
              <Button 
                variant="ghost" 
                size="icon-xs" 
                onClick={onNewDirectMessage}
                className="h-6 w-6"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-0.5">
              {filteredDMs.length > 0 ? (
                filteredDMs.map(renderChannelItem)
              ) : (
                <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                  Aucune conversation
                </p>
              )}
            </div>
          </div>

          {/* Entity Conversations by Type */}
          {Object.keys(groupedEntityConversations).length > 0 && (
            <div className="space-y-2">
              <div className="px-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fils de discussion
                </span>
              </div>
              {(Object.entries(groupedEntityConversations) as [EntityType, EntityConversation[]][]).map(([type, conversations]) => {
                const Icon = entityIcons[type];
                const isExpanded = expandedEntityTypes[type];
                
                return (
                  <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleEntityType(type)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <Icon className="h-3.5 w-3.5" />
                        <span>{entityLabels[type]}</span>
                        <Badge variant="outline" className="h-5 min-w-5 px-1.5 text-[10px] ml-auto">
                          {conversations.length}
                        </Badge>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-0.5 mt-1">
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
