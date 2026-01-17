import { useEffect, useRef } from "react";
import { Hash, Lock, MessageCircle, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamChannel, useChannelMessages, useTeamMessageMutations } from "@/hooks/useTeamMessages";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";

interface ChannelViewProps {
  channel: TeamChannel;
  onOpenThread: (messageId: string) => void;
}

export function ChannelView({ channel, onOpenThread }: ChannelViewProps) {
  const { data: messages, isLoading } = useChannelMessages(channel.id);
  const { createMessage, markChannelAsRead } = useTeamMessageMutations();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isDM = channel.channel_type === "direct";

  // Get display name for DM channel
  const getDMDisplayName = () => {
    const parts = channel.name.replace("dm-", "").split("-");
    const otherUserId = parts.find(id => id !== user?.id) || parts[parts.length - 1];
    const otherProfile = profiles.find(p => p.user_id === otherUserId);
    return otherProfile?.full_name || "Utilisateur";
  };

  const getDMAvatar = () => {
    const parts = channel.name.replace("dm-", "").split("-");
    const otherUserId = parts.find(id => id !== user?.id) || parts[parts.length - 1];
    return profiles.find(p => p.user_id === otherUserId);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const dmProfile = isDM ? getDMAvatar() : null;
  const displayName = isDM ? getDMDisplayName() : channel.name;

  // Mark channel as read when opened
  useEffect(() => {
    markChannelAsRead.mutate(channel.id);
  }, [channel.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSendMessage = async (content: string, mentions: string[]) => {
    await createMessage.mutateAsync({
      channel_id: channel.id,
      content,
      mentions,
    });
  };

  const Icon = isDM ? MessageCircle : (channel.channel_type === "private" ? Lock : Hash);

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          {isDM && dmProfile ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={dmProfile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(dmProfile.full_name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Icon className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="font-semibold">{displayName}</h2>
            {channel.description && !isDM && (
              <span className="text-sm text-muted-foreground">
                {channel.description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm">
            <Users className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                {isDM && dmProfile ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={dmProfile.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(dmProfile.full_name)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-medium mb-1">
                {isDM ? `Conversation avec ${displayName}` : `Bienvenue dans #${channel.name}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                C'est le début de la conversation{isDM ? "" : " dans ce canal"}.
              </p>
            </div>
          ) : (
            messages?.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showAuthor = !prevMessage || 
                prevMessage.created_by !== message.created_by ||
                new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000;

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  showAuthor={showAuthor}
                  onOpenThread={() => onOpenThread(message.id)}
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <MessageInput
          channelName={displayName}
          onSend={handleSendMessage}
          isLoading={createMessage.isPending}
        />
      </div>
    </div>
  );
}
