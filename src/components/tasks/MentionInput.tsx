import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  onMentionsChange,
  placeholder = "Écrivez quelque chose... Utilisez @ pour mentionner",
  rows = 3,
  className,
}: MentionInputProps) {
  const { activeWorkspace } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  const { data: members } = useQuery({
    queryKey: ["workspace-members-mentions", activeWorkspace?.id],
    queryFn: async () => {
      const { data: memberData } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", activeWorkspace!.id);

      if (!memberData) return [];

      const userIds = memberData.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("user_id", userIds);

      return (profiles as Profile[]) || [];
    },
    enabled: !!activeWorkspace?.id,
  });

  const filteredMembers = members?.filter((m) =>
    m.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  ) || [];

  useEffect(() => {
    // Extract mentions from text
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(value)) !== null) {
      mentions.push(match[2]); // user_id
    }
    onMentionsChange?.(mentions);
  }, [value, onMentionsChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    setCursorPosition(cursor);

    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setShowMentions(true);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }

    onChange(newValue);
  };

  const insertMention = (member: Profile) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    const newValue =
      textBeforeCursor.slice(0, atIndex) +
      `@[${member.full_name}](${member.user_id}) ` +
      textAfterCursor;

    onChange(newValue);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || filteredMembers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filteredMembers[mentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Display text with formatted mentions
  const displayValue = value.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    "@$1"
  );

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="resize-none"
      />

      {/* Mention Dropdown */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute z-50 w-64 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredMembers.map((member, index) => (
            <button
              key={member.user_id}
              type="button"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                index === mentionIndex && "bg-muted"
              )}
              onClick={() => insertMention(member)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{member.full_name || "Utilisateur"}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Utilisez @ pour mentionner un membre de l'équipe
      </p>
    </div>
  );
}
