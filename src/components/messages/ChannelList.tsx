import { Hash, Lock, MessageCircle, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TeamChannel, useUnreadCounts } from "@/hooks/useTeamMessages";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "private":
        return Lock;
      case "direct":
        return MessageCircle;
      default:
        return Hash;
    }
  };

  const renderChannelItem = (channel: TeamChannel) => {
    const Icon = getChannelIcon(channel.channel_type);
    const unread = unreadCounts?.[channel.id] || 0;
    const isActive = channel.id === activeChannelId;

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
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate flex-1">
          {channel.channel_type === "direct" 
            ? channel.name.replace("dm-", "").split("-").pop() 
            : channel.name
          }
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
