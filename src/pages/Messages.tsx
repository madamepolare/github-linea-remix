import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamChannels, useTeamMessageMutations } from "@/hooks/useTeamMessages";
import { ChannelList } from "@/components/messages/ChannelList";
import { ChannelView } from "@/components/messages/ChannelView";
import { CreateChannelDialog } from "@/components/messages/CreateChannelDialog";
import { DirectMessageDialog } from "@/components/messages/DirectMessageDialog";
import { ThreadPanel } from "@/components/messages/ThreadPanel";
import { EntityConversationView } from "@/components/messages/EntityConversationView";
import { Hash, MessageSquare, ChevronLeft, Plus, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { THIN_STROKE } from "@/components/ui/icon";

type MessageFilter = "all" | "direct";

export default function Messages() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: channels, isLoading } = useTeamChannels();
  const { createChannel } = useTeamMessageMutations();
  const { user } = useAuth();
  
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showMobileChannelList, setShowMobileChannelList] = useState(false);

  // Determine filter from URL
  const getFilterFromPath = (): MessageFilter => {
    if (location.pathname === "/messages/direct" || location.pathname.startsWith("/messages/direct/")) {
      return "direct";
    }
    return "all";
  };
  
  const [filter, setFilter] = useState<MessageFilter>(getFilterFromPath());

  // Update filter when route changes
  useEffect(() => {
    setFilter(getFilterFromPath());
  }, [location.pathname]);

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
      // Filter channels based on current filter
      const filteredChannels = filter === "direct" 
        ? channels.filter(c => c.channel_type === "direct")
        : channels;
      
      if (filteredChannels.length > 0) {
        const firstChannel = filteredChannels[0];
        setActiveChannelId(firstChannel.id);
        const basePath = filter === "direct" ? "/messages/direct" : "/messages";
        navigate(`${basePath}/${firstChannel.id}`, { replace: true });
      }
    }
  }, [channelId, channels, activeChannelId, navigate, filter]);

  const handleSelectChannel = (id: string) => {
    setActiveChannelId(id);
    setSelectedThreadId(null);
    setShowMobileChannelList(false);
    const basePath = filter === "direct" ? "/messages/direct" : "/messages";
    navigate(`${basePath}/${id}`);
  };

  const handleFilterChange = (newFilter: MessageFilter) => {
    setFilter(newFilter);
    setActiveChannelId(null);
    navigate(newFilter === "direct" ? "/messages/direct" : "/messages");
  };

  const handleOpenThread = (messageId: string) => {
    setSelectedThreadId(messageId);
  };

  const handleBackToList = () => {
    setActiveChannelId(null);
    navigate(filter === "direct" ? "/messages/direct" : "/messages");
  };

  // Check if the active channel is an entity conversation
  const isEntityConversation = activeChannelId?.startsWith("entity-");

  const activeChannel = channels?.find(c => c.id === activeChannelId);

  // Mobile: show channel list when no active channel
  const showChannelListMobile = !activeChannelId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem-env(safe-area-inset-bottom,0px))] overflow-hidden bg-background pb-safe">
      {/* Desktop: Channel Sidebar */}
      <div className="w-64 border-r flex-shrink-0 hidden md:flex flex-col bg-card/50">
        <ChannelList
          channels={channels || []}
          activeChannelId={activeChannelId}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={() => setShowCreateChannel(true)}
          onNewDirectMessage={() => setShowDirectMessage(true)}
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Mobile: Full-screen channel list OR chat view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:hidden">
        <AnimatePresence mode="wait">
          {showChannelListMobile ? (
            <motion.div
              key="channel-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {/* Mobile Header for Channel List */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-xl sticky top-0 z-10">
                <h1 className="text-lg font-semibold">Messages</h1>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDirectMessage(true)}
                    className="h-9 w-9"
                  >
                    <PenSquare className="h-5 w-5" strokeWidth={THIN_STROKE} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreateChannel(true)}
                    className="h-9 w-9"
                  >
                    <Plus className="h-5 w-5" strokeWidth={THIN_STROKE} />
                  </Button>
                </div>
              </div>
              <ChannelList
                channels={channels || []}
                activeChannelId={activeChannelId}
                onSelectChannel={handleSelectChannel}
                onCreateChannel={() => setShowCreateChannel(true)}
                onNewDirectMessage={() => setShowDirectMessage(true)}
                filter={filter}
                onFilterChange={handleFilterChange}
              />
            </motion.div>
          ) : activeChannel || isEntityConversation ? (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              {isEntityConversation && activeChannelId ? (
                <EntityConversationView
                  entityKey={activeChannelId}
                  onClose={handleBackToList}
                  onBack={handleBackToList}
                />
              ) : activeChannel ? (
                <ChannelView
                  channel={activeChannel}
                  onOpenThread={handleOpenThread}
                  onBack={handleBackToList}
                />
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center text-muted-foreground p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2">Bienvenue</h3>
                <p className="text-sm text-muted-foreground mb-4">Sélectionnez une conversation</p>
                <Button onClick={() => setShowDirectMessage(true)}>
                  <PenSquare className="h-4 w-4 mr-2" />
                  Nouveau message
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: Main Content */}
      <div className="flex-1 flex-col min-w-0 overflow-hidden hidden md:flex">
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
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 opacity-50" />
              </div>
              <h3 className="text-lg font-medium mb-2">Bienvenue dans Messages</h3>
              <p className="text-sm mb-4">Sélectionnez un canal ou créez-en un nouveau pour commencer</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowCreateChannel(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un canal
                </Button>
                <Button onClick={() => setShowDirectMessage(true)}>
                  <PenSquare className="h-4 w-4 mr-2" />
                  Message direct
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thread Panel - Desktop only */}
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
