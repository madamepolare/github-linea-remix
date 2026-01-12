import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useWorkspaceProfiles, WorkspaceProfile } from "@/hooks/useWorkspaceProfiles";

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  minHeight?: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Écrire un message...",
  className,
  autoFocus = false,
  minHeight = "80px",
}: MentionInputProps) {
  const { data: profiles = [] } = useWorkspaceProfiles();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Extract mentioned user IDs from content
  const extractMentions = useCallback((content: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // User ID
    }
    return mentions;
  }, []);

  // Filter profiles based on search
  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name?.toLowerCase().includes(suggestionFilter.toLowerCase())
  );

  // Get initials
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    setCursorPosition(newCursorPos);

    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, newCursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if we're in a mention context (no space after @, not inside existing mention)
      const isInMentionContext = !textAfterAt.includes(" ") && !textAfterAt.includes("\n");
      const isNotInsideExistingMention = !textBeforeCursor.slice(lastAtIndex).includes("](");
      
      if (isInMentionContext && isNotInsideExistingMention) {
        setMentionStartPos(lastAtIndex);
        setSuggestionFilter(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
        setMentionStartPos(null);
      }
    } else {
      setShowSuggestions(false);
      setMentionStartPos(null);
    }

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  // Insert mention
  const insertMention = (profile: WorkspaceProfile) => {
    if (mentionStartPos === null) return;

    const before = value.slice(0, mentionStartPos);
    const after = value.slice(cursorPosition);
    const mentionText = `@[${profile.full_name}](${profile.user_id})`;
    const newValue = before + mentionText + " " + after;

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);

    setShowSuggestions(false);
    setMentionStartPos(null);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = mentionStartPos + mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredProfiles.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredProfiles.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredProfiles.length - 1
        );
        break;
      case "Enter":
        if (showSuggestions && filteredProfiles[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredProfiles[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setMentionStartPos(null);
        break;
      case "Tab":
        if (showSuggestions && filteredProfiles[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredProfiles[selectedIndex]);
        }
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, showSuggestions]);

  // Render display value (convert mention syntax to visible text)
  const getDisplayValue = () => {
    return value.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={getDisplayValue()}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("resize-none", className)}
          style={{ minHeight }}
          autoFocus={autoFocus}
        />
        <div className="absolute right-2 bottom-2 pointer-events-none">
          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
            <AtSign className="h-3 w-3" />
            pour mentionner
          </span>
        </div>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && filteredProfiles.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {filteredProfiles.map((profile, index) => (
              <button
                key={profile.user_id}
                type="button"
                onClick={() => insertMention(profile)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Avatar className="h-7 w-7">
                  {profile.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
                  )}
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile.full_name || "Utilisateur"}
                  </p>
                  {profile.job_title && (
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.job_title}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {showSuggestions && filteredProfiles.length === 0 && suggestionFilter && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg z-50 p-3"
          >
            <p className="text-sm text-muted-foreground text-center">
              Aucun utilisateur trouvé pour "@{suggestionFilter}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to render content with styled mentions
export function renderContentWithMentions(content: string, profiles: WorkspaceProfile[]): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const mentionName = match[1];
    const userId = match[2];
    const profile = profiles.find((p) => p.user_id === userId);

    parts.push(
      <span
        key={match.index}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-sm"
      >
        <AtSign className="h-3 w-3" />
        {profile?.full_name || mentionName}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}
