import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Hash, Lock, MessageCircle, UserMinus, UserPlus, Users, ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamChannel, TeamMessage, useChannelMessages, useChannelMembers, useTeamMessageMutations } from "@/hooks/useTeamMessages";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";

interface ChannelViewProps {
  channel: TeamChannel;
  onOpenThread: (messageId: string) => void;
  onBack?: () => void;
}

export function ChannelView({ channel, onOpenThread, onBack }: ChannelViewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: messages, isLoading } = useChannelMessages(channel.id);
  const { data: members = [], refetch: refetchMembers } = useChannelMembers(channel.id);
  const { createMessage, markChannelAsRead, removeMember } = useTeamMessageMutations();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; author?: { full_name: string | null; avatar_url: string | null } } | null>(null);
  
  // Typing indicator
  const { typingUsers, setTyping } = useTypingIndicator(channel.id);

  // Check if current user is admin of this channel
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentUserMember?.role === "admin";

  const isDM = channel.channel_type === "direct";
  const dmMember = channel.dm_member;
  const displayName = isDM ? (dmMember?.full_name || "Utilisateur") : channel.name;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Get profiles for channel members
  const memberProfiles = members.map(m => {
    const profile = profiles.find(p => p.user_id === m.user_id);
    return {
      ...m,
      profile,
    };
  });

  // Mark channel as read when opened
  useEffect(() => {
    markChannelAsRead.mutate(channel.id);
  }, [channel.id]);

  // Scroll to bottom on new messages (within the scroll container only)
  useEffect(() => {
    if (bottomRef.current && scrollRef.current) {
      // Use scrollTop on the container instead of scrollIntoView to avoid page scroll
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages?.length]);

  const handleSendMessage = async (content: string, mentions: string[], attachments?: { url: string; name: string; type: string; size: number }[], parentId?: string) => {
    await createMessage.mutateAsync({
      channel_id: channel.id,
      content,
      mentions,
      attachments,
      parent_id: parentId,
    });
  };

  const handleReply = (message: TeamMessage) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      author: message.author,
    });
  };

  const Icon = isDM ? MessageCircle : (channel.channel_type === "private" ? Lock : Hash);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Channel Header - Mobile optimized */}
      <motion.header 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 px-2 md:px-4 py-2 md:py-3 border-b bg-background/95 backdrop-blur-xl sticky top-0 z-10 safe-area-inset-top shrink-0"
      >
        {/* Back button - Mobile only */}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 md:hidden shrink-0"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={THIN_STROKE} />
          </Button>
        )}

        {/* Avatar/Icon */}
        {isDM && dmMember ? (
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={dmMember.avatar_url || undefined} />
            <AvatarFallback className="text-xs font-medium">
              {getInitials(dmMember.full_name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm md:text-base truncate">{displayName}</h2>
          {channel.description && !isDM && (
            <p className="text-xs text-muted-foreground truncate hidden md:block">
              {channel.description}
            </p>
          )}
          {isDM && (
            <p className="text-xs text-muted-foreground">En ligne</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowMembers(true)}
            className="h-9 w-9"
          >
            <Users className="h-4 w-4" strokeWidth={THIN_STROKE} />
          </Button>
        </div>
      </motion.header>

      {/* Messages - Scrollable area */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="px-3 md:px-4 py-4 space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                {isDM && dmMember ? (
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={dmMember.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">{getInitials(dmMember.full_name)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className="h-8 w-8 text-primary" />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-1">
                {isDM ? `Conversation avec ${displayName}` : `#${channel.name}`}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {isDM 
                  ? "C'est le début de votre conversation." 
                  : "Bienvenue ! C'est le début de ce canal."}
              </p>
            </motion.div>
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
                  onReply={() => handleReply(message)}
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <TypingIndicator typingUsers={typingUsers} />
        )}
      </AnimatePresence>

      {/* Message Input - Fixed at bottom */}
      <div className="shrink-0 p-3 md:p-4 border-t bg-background safe-area-inset-bottom pr-4 md:pr-4">
        <MessageInput
          channelName={displayName}
          onSend={handleSendMessage}
          isLoading={createMessage.isPending}
          onTypingChange={setTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {/* Members Sheet */}
      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {isDM ? "Participants" : `Membres de #${channel.name}`}
            </SheetTitle>
          </SheetHeader>
          
          {/* Add members button - only for non-DM channels */}
          {!isDM && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                setShowMembers(false);
                setShowInvite(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter des membres
            </Button>
          )}
          
          <div className="mt-4 space-y-1">
            {memberProfiles.map((member) => {
              const canRemove = !isDM && isAdmin && member.user_id !== user?.id;
              
              return (
                <div 
                  key={member.id} 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 group transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">
                      {getInitials(member.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.profile?.full_name || "Utilisateur"}
                    </p>
                    {member.role === "admin" && (
                      <span className="text-xs text-primary">Admin</span>
                    )}
                  </div>
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        try {
                          await removeMember.mutateAsync({
                            channelId: channel.id,
                            userId: member.user_id,
                          });
                          refetchMembers();
                          toast.success("Membre retiré du canal");
                        } catch (error) {
                          toast.error("Erreur lors du retrait du membre");
                        }
                      }}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
            {memberProfiles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun membre
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Invite Members Dialog */}
      <InviteMembersDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        channelId={channel.id}
        channelName={channel.name}
        existingMemberIds={members.map(m => m.user_id)}
        onMembersAdded={() => {
          refetchMembers();
          queryClient.invalidateQueries({ queryKey: ["team-channel-members", channel.id] });
        }}
      />
    </div>
  );
}
