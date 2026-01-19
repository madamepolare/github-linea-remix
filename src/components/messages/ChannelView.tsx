import { useEffect, useRef, useState } from "react";
import { Hash, Lock, MessageCircle, UserMinus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamChannel, useChannelMessages, useChannelMembers, useTeamMessageMutations } from "@/hooks/useTeamMessages";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { AnimatePresence } from "framer-motion";

interface ChannelViewProps {
  channel: TeamChannel;
  onOpenThread: (messageId: string) => void;
}

export function ChannelView({ channel, onOpenThread }: ChannelViewProps) {
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

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSendMessage = async (content: string, mentions: string[], attachments?: { url: string; name: string; type: string; size: number }[]) => {
    await createMessage.mutateAsync({
      channel_id: channel.id,
      content,
      mentions,
      attachments,
    });
  };

  const Icon = isDM ? MessageCircle : (channel.channel_type === "private" ? Lock : Hash);

  return (
    <div className="flex flex-col h-full">
      {/* Channel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          {isDM && dmMember ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={dmMember.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(dmMember.full_name)}
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
          <Button variant="ghost" size="icon-sm" onClick={() => setShowMembers(true)}>
            <Users className="h-4 w-4" />
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
                {isDM && dmMember ? (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={dmMember.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(dmMember.full_name)}</AvatarFallback>
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

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <TypingIndicator typingUsers={typingUsers} />
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="p-4 border-t">
        <MessageInput
          channelName={displayName}
          onSend={handleSendMessage}
          isLoading={createMessage.isPending}
          onTypingChange={setTyping}
        />
      </div>

      {/* Members Sheet */}
      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetContent>
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
          
          <div className="mt-4 space-y-2">
            {memberProfiles.map((member) => {
              const canRemove = !isDM && isAdmin && member.user_id !== user?.id;
              
              return (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.profile?.full_name || "Utilisateur"}
                    </p>
                    {member.role === "admin" && (
                      <span className="text-xs text-muted-foreground">Admin</span>
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
              <p className="text-sm text-muted-foreground text-center py-4">
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
