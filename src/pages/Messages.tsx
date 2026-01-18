import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTeamChannels, useTeamMessageMutations } from "@/hooks/useTeamMessages";
import { ChannelList } from "@/components/messages/ChannelList";
import { ChannelView } from "@/components/messages/ChannelView";
import { CreateChannelDialog } from "@/components/messages/CreateChannelDialog";
import { DirectMessageDialog } from "@/components/messages/DirectMessageDialog";
import { ThreadPanel } from "@/components/messages/ThreadPanel";
import { EntityConversationView } from "@/components/messages/EntityConversationView";
import { Hash, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function Messages() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { data: channels, isLoading } = useTeamChannels();
  const { createChannel } = useTeamMessageMutations();
  const { user } = useAuth();
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Listen for events from navigation
  useEffect(() => {
    const handleOpenCreateChannel = () => setShowCreateChannel(true);
    const handleOpenNewDM = () => setShowDirectMessage(true);
    
    window.addEventListener("open-create-channel", handleOpenCreateChannel);
    window.addEventListener("open-new-dm", handleOpenNewDM);
    
    return () => {
      window.removeEventListener("open-create-channel", handleOpenCreateChannel);
      window.removeEventListener("open-new-dm", handleOpenNewDM);
    };
  }, []);

  // Set active channel from URL or default to first
  useEffect(() => {
    if (channelId) {
      setActiveChannelId(channelId);
    } else if (channels?.length && !activeChannelId) {
      const firstChannel = channels[0];
      setActiveChannelId(firstChannel.id);
      navigate(`/messages/${firstChannel.id}`, { replace: true });
    }
  }, [channelId, channels, activeChannelId, navigate]);

  const handleSelectChannel = (id: string) => {
    setActiveChannelId(id);
    setSelectedThreadId(null);
    navigate(`/messages/${id}`);
  };

  const handleOpenThread = (messageId: string) => {
    setSelectedThreadId(messageId);
  };

  // Check if the active channel is an entity conversation
  const isEntityConversation = activeChannelId?.startsWith("entity-");

  const activeChannel = channels?.find(c => c.id === activeChannelId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Channel Sidebar */}
      <div className="w-64 border-r flex-shrink-0 hidden md:block">
        <ChannelList
          channels={channels || []}
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={() => setShowCreateChannel(true)}
          onNewDirectMessage={() => setShowDirectMessage(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {isEntityConversation && activeChannelId ? (
          <EntityConversationView
            entityKey={activeChannelId}
            onClose={() => {
              setActiveChannelId(null);
              navigate("/messages");
            }}
          />
        ) : activeChannel ? (
          <ChannelView
            channel={activeChannel}
            onOpenThread={handleOpenThread}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Bienvenue dans Messages</h3>
              <p className="text-sm">Sélectionnez un canal ou créez-en un nouveau pour commencer</p>
            </div>
          </div>
        )}
      </div>

      {/* Thread Panel */}
      {selectedThreadId && activeChannelId && (
        <div className="w-96 border-l flex-shrink-0 hidden lg:block">
          <ThreadPanel
            parentMessageId={selectedThreadId}
            channelId={activeChannelId}
            onClose={() => setSelectedThreadId(null)}
          />
        </div>
      )}

      {/* Dialogs */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreateChannel={async (data) => {
          await createChannel.mutateAsync(data);
          setShowCreateChannel(false);
        }}
      />

      <DirectMessageDialog
        open={showDirectMessage}
        onOpenChange={setShowDirectMessage}
        onStartConversation={async (userId) => {
          // Create or find existing DM channel
          const existingDM = channels?.find(
            c => c.channel_type === "direct" && c.name.includes(userId)
          );
          
          if (existingDM) {
            handleSelectChannel(existingDM.id);
          } else {
            const channel = await createChannel.mutateAsync({
              name: `dm-${user?.id}-${userId}`,
              channel_type: "direct",
              member_ids: [userId],
            });
            handleSelectChannel(channel.id);
          }
          setShowDirectMessage(false);
        }}
      />
    </div>
  );
}
