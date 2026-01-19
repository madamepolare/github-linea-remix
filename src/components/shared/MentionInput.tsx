import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AtSign, FolderKanban, FileText, CheckSquare, Package, Calendar, Slash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useWorkspaceProfiles, WorkspaceProfile } from "@/hooks/useWorkspaceProfiles";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useCommercialDocuments } from "@/hooks/useCommercialDocuments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  minHeight?: string;
}

type SuggestionMode = "none" | "mention" | "entity";

interface EntityItem {
  id: string;
  type: "project" | "quote" | "task" | "deliverable" | "event";
  name: string;
  subtitle?: string;
  color?: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Écrire un message...",
  className,
  autoFocus = false,
  minHeight = "80px",
}: MentionInputProps) {
  const { activeWorkspace } = useAuth();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const { projects = [] } = useProjects();
  const { tasks = [] } = useTasks();
  const { documents: commercialDocs = [] } = useCommercialDocuments();
  
  // Fetch deliverables and events for the workspace
  const { data: deliverables = [] } = useQuery({
    queryKey: ["all-deliverables", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("project_deliverables")
        .select("id, name, project:projects(name)")
        .eq("workspace_id", activeWorkspace.id)
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["all-events", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("project_calendar_events")
        .select("id, title, project:projects(name)")
        .eq("workspace_id", activeWorkspace.id)
        .order("start_datetime", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
  });

  const [suggestionMode, setSuggestionMode] = useState<SuggestionMode>("none");
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [triggerStartPos, setTriggerStartPos] = useState<number | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityItem["type"] | null>(null);
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

  // Build project name map for lookups
  const projectNameMap = projects.reduce((acc, p) => {
    acc[p.id] = p.name;
    return acc;
  }, {} as Record<string, string>);

  // Build entity list
  const allEntities: EntityItem[] = [
    ...projects.map(p => ({ 
      id: p.id, 
      type: "project" as const, 
      name: p.name, 
      color: p.color || undefined 
    })),
    ...commercialDocs
      .filter(d => d.document_type === "quote")
      .map(d => ({ 
        id: d.id, 
        type: "quote" as const, 
        name: d.title, 
        subtitle: d.document_number 
      })),
    ...tasks.map(t => ({ 
      id: t.id, 
      type: "task" as const, 
      name: t.title, 
      subtitle: t.project_id ? projectNameMap[t.project_id] : undefined 
    })),
    ...deliverables.map(d => ({ 
      id: d.id, 
      type: "deliverable" as const, 
      name: d.name, 
      subtitle: (d.project as any)?.name 
    })),
    ...events.map(e => ({ 
      id: e.id, 
      type: "event" as const, 
      name: e.title, 
      subtitle: (e.project as any)?.name 
    })),
  ];

  // Filter entities based on search and selected type
  const filteredEntities = allEntities.filter(entity => {
    if (selectedEntityType && entity.type !== selectedEntityType) return false;
    return entity.name?.toLowerCase().includes(suggestionFilter.toLowerCase());
  });

  // Entity type options for first-level selection
  const entityTypeOptions = [
    { type: "project" as const, label: "Projets", icon: FolderKanban },
    { type: "quote" as const, label: "Devis", icon: FileText },
    { type: "task" as const, label: "Tâches", icon: CheckSquare },
    { type: "deliverable" as const, label: "Livrables", icon: Package },
    { type: "event" as const, label: "Événements", icon: Calendar },
  ];

  // Get current suggestions based on mode
  const getCurrentSuggestions = () => {
    if (suggestionMode === "mention") return filteredProfiles;
    if (suggestionMode === "entity") {
      if (!selectedEntityType) return entityTypeOptions;
      return filteredEntities;
    }
    return [];
  };

  const suggestions = getCurrentSuggestions();

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

  // Get entity icon
  const getEntityIcon = (type: EntityItem["type"]) => {
    switch (type) {
      case "project": return FolderKanban;
      case "quote": return FileText;
      case "task": return CheckSquare;
      case "deliverable": return Package;
      case "event": return Calendar;
    }
  };

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    setCursorPosition(newCursorPos);

    const textBeforeCursor = newValue.slice(0, newCursorPos);
    
    // Check for @ trigger (mentions)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
    
    // Determine which trigger is more recent
    if (lastAtIndex > lastSlashIndex && lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const isInMentionContext = !textAfterAt.includes(" ") && !textAfterAt.includes("\n");
      const isNotInsideExistingMention = !textBeforeCursor.slice(lastAtIndex).includes("](");
      
      if (isInMentionContext && isNotInsideExistingMention) {
        setTriggerStartPos(lastAtIndex);
        setSuggestionFilter(textAfterAt);
        setSuggestionMode("mention");
        setSelectedIndex(0);
        setSelectedEntityType(null);
      } else {
        closeSuggestions();
      }
    } else if (lastSlashIndex > lastAtIndex && lastSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.slice(lastSlashIndex + 1);
      const isInEntityContext = !textAfterSlash.includes(" ") && !textAfterSlash.includes("\n");
      const isNotInsideExistingEntity = !textBeforeCursor.slice(lastSlashIndex).includes("](");
      
      if (isInEntityContext && isNotInsideExistingEntity) {
        setTriggerStartPos(lastSlashIndex);
        setSuggestionFilter(textAfterSlash);
        setSuggestionMode("entity");
        setSelectedIndex(0);
      } else {
        closeSuggestions();
      }
    } else {
      closeSuggestions();
    }

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);
  };

  const closeSuggestions = () => {
    setSuggestionMode("none");
    setTriggerStartPos(null);
    setSelectedEntityType(null);
    setSuggestionFilter("");
  };

  // Insert mention
  const insertMention = (profile: WorkspaceProfile) => {
    if (triggerStartPos === null) return;

    const before = value.slice(0, triggerStartPos);
    const after = value.slice(cursorPosition);
    const mentionText = `@[${profile.full_name}](${profile.user_id})`;
    const newValue = before + mentionText + " " + after;

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);

    closeSuggestions();

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = triggerStartPos + mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Insert entity reference
  const insertEntity = (entity: EntityItem) => {
    if (triggerStartPos === null) return;

    const before = value.slice(0, triggerStartPos);
    const after = value.slice(cursorPosition);
    const entityText = `/[${entity.name}](${entity.type}:${entity.id})`;
    const newValue = before + entityText + " " + after;

    const mentions = extractMentions(newValue);
    onChange(newValue, mentions);

    closeSuggestions();

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = triggerStartPos + entityText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Select entity type
  const selectEntityType = (type: EntityItem["type"]) => {
    setSelectedEntityType(type);
    setSuggestionFilter("");
    setSelectedIndex(0);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestionMode === "none" || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        if (suggestionMode === "mention" && filteredProfiles[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredProfiles[selectedIndex]);
        } else if (suggestionMode === "entity") {
          e.preventDefault();
          if (!selectedEntityType) {
            selectEntityType(entityTypeOptions[selectedIndex].type);
          } else if (filteredEntities[selectedIndex]) {
            insertEntity(filteredEntities[selectedIndex]);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        if (selectedEntityType) {
          setSelectedEntityType(null);
          setSelectedIndex(0);
        } else {
          closeSuggestions();
        }
        break;
      case "Tab":
        if (suggestionMode === "mention" && filteredProfiles[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredProfiles[selectedIndex]);
        } else if (suggestionMode === "entity") {
          e.preventDefault();
          if (!selectedEntityType) {
            selectEntityType(entityTypeOptions[selectedIndex].type);
          } else if (filteredEntities[selectedIndex]) {
            insertEntity(filteredEntities[selectedIndex]);
          }
        }
        break;
      case "Backspace":
        if (selectedEntityType && suggestionFilter === "") {
          e.preventDefault();
          setSelectedEntityType(null);
          setSelectedIndex(0);
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
        closeSuggestions();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (suggestionMode !== "none" && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector('[data-selected="true"]') as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, suggestionMode]);

  // Render display value (convert mention and entity syntax to visible text)
  const getDisplayValue = () => {
    let display = value.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
    display = display.replace(/\/\[([^\]]+)\]\([^)]+\)/g, "/$1");
    return display;
  };

  const showSuggestions = suggestionMode !== "none" && suggestions.length > 0;

  return (
    <div className="relative">
      {/* Suggestions dropdown - positioned ABOVE */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 bottom-full mb-1 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
          >
            {suggestionMode === "mention" && filteredProfiles.map((profile, index) => (
              <button
                key={profile.user_id}
                type="button"
                data-selected={index === selectedIndex}
                onClick={() => insertMention(profile)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-muted"
                    : "hover:bg-muted/50"
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

            {suggestionMode === "entity" && !selectedEntityType && entityTypeOptions.map((option, index) => (
              <button
                key={option.type}
                type="button"
                data-selected={index === selectedIndex}
                onClick={() => selectEntityType(option.type)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                  index === selectedIndex
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <option.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}

            {suggestionMode === "entity" && selectedEntityType && (
              <>
                <div className="px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Slash className="h-3 w-3" />
                    <span>{entityTypeOptions.find(o => o.type === selectedEntityType)?.label}</span>
                    <span className="text-muted-foreground/50">• Échap pour revenir</span>
                  </div>
                </div>
                {filteredEntities.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Aucun élément trouvé
                  </div>
                ) : (
                  filteredEntities.map((entity, index) => {
                    const Icon = getEntityIcon(entity.type);
                    return (
                      <button
                        key={entity.id}
                        type="button"
                        data-selected={index === selectedIndex}
                        onClick={() => insertEntity(entity)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                          index === selectedIndex
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div 
                          className="h-7 w-7 rounded-md flex items-center justify-center"
                          style={{ 
                            backgroundColor: entity.color ? `${entity.color}20` : 'hsl(var(--primary) / 0.1)'
                          }}
                        >
                          <Icon 
                            className="h-4 w-4" 
                            style={{ color: entity.color || 'hsl(var(--primary))' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{entity.name}</p>
                          {entity.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{entity.subtitle}</p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results for mentions */}
      <AnimatePresence>
        {suggestionMode === "mention" && filteredProfiles.length === 0 && suggestionFilter && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute left-0 right-0 bottom-full mb-1 bg-background border rounded-lg shadow-lg z-50 p-3"
          >
            <p className="text-sm text-muted-foreground text-center">
              Aucun utilisateur trouvé pour "@{suggestionFilter}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
          <span className="text-[10px] text-muted-foreground/50 flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <AtSign className="h-3 w-3" />
              mentionner
            </span>
            <span className="flex items-center gap-0.5">
              <Slash className="h-3 w-3" />
              lier
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper to get URL for entity type
function getEntityUrl(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "project":
      return `/projects/${entityId}`;
    case "quote":
      return `/commercial/quotes/${entityId}`;
    case "task":
      return `/tasks/${entityId}`;
    case "deliverable":
      // Deliverables are shown within a project context
      return null;
    case "event":
      return `/calendar?event=${entityId}`;
    default:
      return null;
  }
}

// Helper to render content with styled mentions and entity references
// Also converts URLs to clickable links with target="_blank"
export function renderContentWithMentions(content: string, profiles: WorkspaceProfile[]): React.ReactNode {
  const parts: React.ReactNode[] = [];
  
  // Combined regex for @mentions, /entity references, and URLs
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const mentionEntityRegex = /(@\[([^\]]+)\]\(([^)]+)\))|(\/\[([^\]]+)\]\(([^:]+):([^)]+)\))/g;
  
  // First, split by mentions and entities
  let processedContent = content;
  const mentionsAndEntities: { index: number; length: number; node: React.ReactNode }[] = [];
  
  let match;
  while ((match = mentionEntityRegex.exec(content)) !== null) {
    if (match[1]) {
      // It's a @mention
      const mentionName = match[2];
      const userId = match[3];
      const profile = profiles.find((p) => p.user_id === userId);

      mentionsAndEntities.push({
        index: match.index,
        length: match[0].length,
        node: (
          <span
            key={`mention-${match.index}`}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-sm"
          >
            <AtSign className="h-3 w-3" />
            {profile?.full_name || mentionName}
          </span>
        ),
      });
    } else if (match[4]) {
      // It's an /entity reference
      const entityName = match[5];
      const entityType = match[6] as EntityItem["type"];
      const entityId = match[7];

      const getIcon = () => {
        switch (entityType) {
          case "project": return FolderKanban;
          case "quote": return FileText;
          case "task": return CheckSquare;
          case "deliverable": return Package;
          case "event": return Calendar;
          default: return FolderKanban;
        }
      };

      const Icon = getIcon();
      const entityUrl = getEntityUrl(entityType, entityId);

      if (entityUrl) {
        mentionsAndEntities.push({
          index: match.index,
          length: match[0].length,
          node: (
            <a
              key={`entity-${match.index}`}
              href={entityUrl}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.history.pushState({}, '', entityUrl);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium text-sm cursor-pointer hover:bg-secondary/80 hover:underline transition-colors"
              title={`Ouvrir ${entityType}: ${entityName}`}
            >
              <Icon className="h-3 w-3" />
              {entityName}
            </a>
          ),
        });
      } else {
        mentionsAndEntities.push({
          index: match.index,
          length: match[0].length,
          node: (
            <span
              key={`entity-${match.index}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-medium text-sm"
              title={`${entityType}: ${entityName}`}
            >
              <Icon className="h-3 w-3" />
              {entityName}
            </span>
          ),
        });
      }
    }
  }

  // Now process the content with mentions, entities, and URLs
  let lastIndex = 0;
  
  // Sort mentions and entities by index
  mentionsAndEntities.sort((a, b) => a.index - b.index);
  
  for (const item of mentionsAndEntities) {
    // Add text before this item (may contain URLs)
    if (item.index > lastIndex) {
      const textBefore = content.slice(lastIndex, item.index);
      parts.push(...renderTextWithUrls(textBefore, lastIndex));
    }
    
    parts.push(item.node);
    lastIndex = item.index + item.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    parts.push(...renderTextWithUrls(remainingText, lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// Helper to render URLs as clickable links with target="_blank"
function renderTextWithUrls(text: string, baseIndex: number): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add clickable URL
    const url = match[1];
    parts.push(
      <a
        key={`url-${baseIndex}-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
