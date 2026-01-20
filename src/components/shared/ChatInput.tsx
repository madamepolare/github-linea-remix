import { useState, useRef, useCallback, useEffect, forwardRef } from "react";
import { Send, Paperclip, Smile, X, FileText, Image as ImageIcon, Loader2, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentionInput } from "@/components/shared/MentionInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface AttachmentData {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ReplyingTo {
  id: string;
  content: string;
  author?: {
    full_name: string | null;
    avatar_url?: string | null;
  };
}

interface ChatInputProps {
  placeholder?: string;
  onSend: (content: string, mentions: string[], attachments?: AttachmentData[], parentId?: string) => Promise<void>;
  isLoading?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
  replyingTo?: ReplyingTo | null;
  onCancelReply?: () => void;
  showAttachments?: boolean;
  variant?: "default" | "compact" | "inline";
  className?: string;
  autoFocus?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(({
  placeholder = "Message...",
  onSend,
  isLoading,
  onTypingChange,
  replyingTo,
  onCancelReply,
  showAttachments = true,
  variant = "default",
  className,
  autoFocus = false,
}, ref) => {
  const { user, activeWorkspace } = useAuth();
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (!onTypingChange) return;

    if (content.trim()) {
      onTypingChange(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange(false);
      }, 2000);
    } else {
      onTypingChange(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, onTypingChange]);

  const uploadFile = async (file: File): Promise<AttachmentData | null> => {
    if (!user?.id || !activeWorkspace?.id) {
      toast.error("Vous devez être connecté pour envoyer des fichiers");
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Le fichier "${file.name}" dépasse la limite de 20 Mo`);
      return null;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Type de fichier non supporté: ${file.type}`);
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error(`Erreur lors de l'envoi de "${file.name}"`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    const uploadPromises = fileArray.map(file => uploadFile(file));
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter((r): r is AttachmentData => r !== null);
    
    if (successfulUploads.length > 0) {
      setAttachments(prev => [...prev, ...successfulUploads]);
      toast.success(`${successfulUploads.length} fichier(s) ajouté(s)`);
    }
    setIsUploading(false);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && attachments.length === 0) || isLoading || isUploading) return;
    
    onTypingChange?.(false);
    
    await onSend(content, mentions, attachments.length > 0 ? attachments : undefined, replyingTo?.id);
    setContent("");
    setMentions([]);
    setAttachments([]);
    onCancelReply?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const isCompact = variant === "compact" || variant === "inline";
  const canSend = (content.trim() || attachments.length > 0) && !isLoading && !isUploading;

  return (
    <div 
      ref={ref}
      className={cn("relative", className)}
      onDragEnter={showAttachments ? handleDragEnter : undefined}
      onDragLeave={showAttachments ? handleDragLeave : undefined}
      onDragOver={showAttachments ? handleDragOver : undefined}
      onDrop={showAttachments ? handleDrop : undefined}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {isDragging && showAttachments && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-2xl"
          >
            <div className="text-center">
              <Paperclip className="h-6 w-6 mx-auto mb-1 text-primary" />
              <p className="text-xs font-medium text-primary">Déposez ici</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-xl">
              <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-primary font-medium">
                  Réponse à {replyingTo.author?.full_name || "Utilisateur"}
                </span>
                <p className="text-xs text-muted-foreground truncate">
                  {replyingTo.content.slice(0, 60)}{replyingTo.content.length > 60 ? "..." : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onCancelReply}
                className="shrink-0 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.map((attachment, index) => {
                const isImage = attachment.type.startsWith('image/');
                
                return (
                  <div 
                    key={index}
                    className="relative group flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-lg text-xs"
                  >
                    {isImage ? (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="h-6 w-6 object-cover rounded"
                      />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate max-w-[80px]">{attachment.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container - chat bubble style */}
      <div 
        ref={dropZoneRef}
        className={cn(
          "relative flex items-end rounded-2xl transition-all duration-200",
          variant === "inline" 
            ? "bg-muted/30 border border-border/50" 
            : "bg-muted/50 border border-transparent",
          isFocused && "bg-background border-border shadow-sm",
          isDragging && "opacity-0"
        )}
      >
        {/* Attach button - inside left */}
        {showAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
                isCompact ? "h-8 w-8 ml-1" : "h-9 w-9 ml-1.5"
              )}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {/* Text input */}
        <div 
          className={cn(
            "flex-1 min-w-0",
            showAttachments ? "py-1" : "py-1 pl-3"
          )}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <MentionInput
            value={content}
            onChange={(val, extractedMentions) => {
              setContent(val);
              setMentions(extractedMentions);
            }}
            placeholder={placeholder}
            minHeight={isCompact ? "32px" : "36px"}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none text-base"
            autoFocus={autoFocus}
          />
        </div>

        {/* Send button - inside right, always visible */}
        <Button 
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
          className={cn(
            "shrink-0 rounded-full transition-all duration-200",
            isCompact ? "h-8 w-8 mr-1 mb-1" : "h-9 w-9 mr-1.5 mb-1.5",
            canSend 
              ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:scale-105" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className={cn(
            "transition-transform",
            isCompact ? "h-3.5 w-3.5" : "h-4 w-4",
            canSend && "-rotate-45"
          )} />
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
