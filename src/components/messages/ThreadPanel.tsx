import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useChannelMessages, useThreadMessages, useTeamMessageMutations } from "@/hooks/useTeamMessages";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";

interface ThreadPanelProps {
  parentMessageId: string;
  channelId: string;
  onClose: () => void;
}

export function ThreadPanel({ parentMessageId, channelId, onClose }: ThreadPanelProps) {
  const { data: channelMessages } = useChannelMessages(channelId);
  const { data: threadMessages, isLoading } = useThreadMessages(parentMessageId);
  const { createMessage } = useTeamMessageMutations();
  const bottomRef = useRef<HTMLDivElement>(null);

  const parentMessage = channelMessages?.find(m => m.id === parentMessageId);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages?.length]);

  const handleSendReply = async (content: string, mentions: string[]) => {
    await createMessage.mutateAsync({
      channel_id: channelId,
      content,
      mentions,
      parent_id: parentMessageId,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">Fil de discussion</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="py-4">
          {/* Parent message */}
          {parentMessage && (
            <>
              <MessageItem
                message={parentMessage}
                showAuthor={true}
                onOpenThread={() => {}}
                isThreadMessage={true}
              />
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground mb-2">
                {threadMessages?.length || 0} réponse{(threadMessages?.length || 0) > 1 ? "s" : ""}
              </div>
            </>
          )}

          {/* Thread messages */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {threadMessages?.map((message, index) => {
                const prevMessage = threadMessages[index - 1];
                const showAuthor = !prevMessage || 
                  prevMessage.created_by !== message.created_by ||
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000;

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    showAuthor={showAuthor}
                    onOpenThread={() => {}}
                    isThreadMessage={true}
                  />
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Reply Input */}
      <div className="p-4 border-t">
        <MessageInput
          channelName="fil"
          onSend={handleSendReply}
          isLoading={createMessage.isPending}
          placeholder="Répondre..."
        />
      </div>
    </div>
  );
}
