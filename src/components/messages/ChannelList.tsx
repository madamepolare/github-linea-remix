import { Hash, Lock, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TeamChannel, useUnreadCounts } from "@/hooks/useTeamMessages";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  
  const publicChannels = channels.filter(c => c.channel_type === "public");
  const privateChannels = channels.filter(c => c.channel_type === "private");
  const directMessages = channels.filter(c => c.channel_type === "direct");

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
        </div>
      </ScrollArea>
    </div>
  );
}
