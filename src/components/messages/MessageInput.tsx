import { useState, useRef, useCallback, useEffect } from "react";
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
import { GifPicker } from "./GifPicker";
import { EmojiPicker } from "./EmojiPicker";
import { TeamMessage } from "@/hooks/useTeamMessages";

// GIF icon component
const GifIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <text x="6" y="15" fontSize="8" fontWeight="bold" stroke="none" fill="currentColor">GIF</text>
  </svg>
);

export interface ReplyingTo {
  id: string;
  content: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface MessageInputProps {
  channelName: string;
  onSend: (content: string, mentions: string[], attachments?: AttachmentData[], parentId?: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  onTypingChange?: (isTyping: boolean) => void;
  replyingTo?: ReplyingTo | null;
  onCancelReply?: () => void;
}

export interface AttachmentData {
  url: string;
  name: string;
  type: string;
  size: number;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
];

export function MessageInput({ channelName, onSend, isLoading, placeholder, onTypingChange, replyingTo, onCancelReply }: MessageInputProps) {
  const { user, activeWorkspace } = useAuth();
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (!onTypingChange) return;

    if (content.trim()) {
      onTypingChange(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
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
    
    // Stop typing when sending
    onTypingChange?.(false);
    
    await onSend(content, mentions, attachments.length > 0 ? attachments : undefined, replyingTo?.id);
    setContent("");
    setMentions([]);
    setAttachments([]);
    onCancelReply?.();
  };

  const handleGifSelect = (gif: { url: string; previewUrl: string; title: string }) => {
    setAttachments(prev => [...prev, {
      url: gif.url,
      name: gif.title || "GIF",
      type: "image/gif",
      size: 0,
    }]);
    setShowGifPicker(false);
    toast.success("GIF ajouté");
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

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div 
      ref={dropZoneRef}
      className="relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
          <div className="text-center">
            <Paperclip className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium text-primary">Déposez vos fichiers ici</p>
          </div>
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
          <Reply className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-primary font-medium">
              Réponse à {replyingTo.author?.full_name || "Utilisateur"}
            </span>
            <p className="text-xs text-muted-foreground truncate">
              {replyingTo.content.slice(0, 100)}{replyingTo.content.length > 100 ? "..." : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCancelReply}
            className="shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/30 rounded-lg border">
          {attachments.map((attachment, index) => {
            const Icon = getFileIcon(attachment.type);
            const isImage = attachment.type.startsWith('image/');
            
            return (
              <div 
                key={index}
                className="relative group flex items-center gap-2 px-2 py-1.5 bg-background rounded border"
              >
                {isImage ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name}
                    className="h-8 w-8 object-cover rounded"
                  />
                ) : (
                  <Icon className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium truncate max-w-[120px]">{attachment.name}</span>
                  <span className="text-2xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className={cn(
        "flex items-end gap-2 bg-muted/50 rounded-lg border p-2 transition-colors",
        isDragging && "opacity-0"
      )}>
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
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>

          {/* GIF Picker */}
          <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <GifIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
              <GifPicker 
                onSelect={handleGifSelect}
                onClose={() => setShowGifPicker(false)}
              />
            </PopoverContent>
          </Popover>

          {/* Emoji Picker - Full picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
              <EmojiPicker 
                onSelect={insertEmoji}
                onClose={() => setShowEmojiPicker(false)}
              />
            </PopoverContent>
          </Popover>

          <Button 
            size="icon-sm" 
            onClick={handleSubmit}
            disabled={(!content.trim() && attachments.length === 0) || isLoading || isUploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
