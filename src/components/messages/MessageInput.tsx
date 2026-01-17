import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentionInput } from "@/components/shared/MentionInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QUICK_REACTIONS } from "@/hooks/useTeamMessages";

interface MessageInputProps {
  channelName: string;
  onSend: (content: string, mentions: string[]) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export function MessageInput({ channelName, onSend, isLoading, placeholder }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!content.trim() || isLoading) return;
    
    await onSend(content, mentions);
    setContent("");
    setMentions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  return (
    <div className="relative">
      <div className="flex items-end gap-2 bg-muted/50 rounded-lg border p-2">
        <div className="flex-1" onKeyDown={handleKeyDown}>
          <MentionInput
            value={content}
            onChange={(val, extractedMentions) => {
              setContent(val);
              setMentions(extractedMentions);
            }}
            placeholder={placeholder || `Message #${channelName}`}
            minHeight="40px"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none"
          />
        </div>

        <div className="flex items-center gap-1 pb-1">
          <Button variant="ghost" size="icon-sm" disabled>
            <Paperclip className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex gap-1">
                {QUICK_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button 
            size="icon-sm" 
            onClick={handleSubmit}
            disabled={!content.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
