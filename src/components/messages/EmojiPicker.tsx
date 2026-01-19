import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMOJI_CATEGORIES, QUICK_REACTIONS } from "@/hooks/useTeamMessages";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  smileys: { label: "Smileys", icon: "😀" },
  gestures: { label: "Gestes", icon: "👋" },
  hearts: { label: "Coeurs", icon: "❤️" },
  objects: { label: "Objets", icon: "🎯" },
  symbols: { label: "Symboles", icon: "✅" },
};

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("smileys");

  // Filter emojis based on search (basic search - just checks if emoji is in results)
  const getFilteredEmojis = () => {
    if (!searchQuery.trim()) return null;
    
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    // For emoji search, we just show all if there's a query since emoji search is limited
    return allEmojis;
  };

  const filteredEmojis = getFilteredEmojis();

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose?.();
  };

  return (
    <div className="w-[320px] bg-background">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un emoji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Quick reactions */}
      <div className="px-3 py-2 border-b">
        <div className="text-xs text-muted-foreground mb-2">Réactions rapides</div>
        <div className="flex flex-wrap gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="p-1.5 hover:bg-muted rounded transition-colors text-xl"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji grid or search results */}
      {filteredEmojis ? (
        <ScrollArea className="h-[200px]">
          <div className="p-3">
            <div className="text-xs text-muted-foreground mb-2">Résultats</div>
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-1.5 hover:bg-muted rounded transition-colors text-xl text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-2 h-10 bg-transparent border-b rounded-none">
            {Object.entries(CATEGORY_LABELS).map(([key, { icon }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-muted px-2 py-1.5 text-lg"
              >
                {icon}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <TabsContent key={category} value={category} className="m-0">
              <ScrollArea className="h-[200px]">
                <div className="p-3">
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={`${emoji}-${index}`}
                        onClick={() => handleEmojiClick(emoji)}
                        className="p-1.5 hover:bg-muted rounded transition-colors text-xl text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
