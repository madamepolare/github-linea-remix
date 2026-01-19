import { useState, useEffect, useCallback } from "react";
import { Search, TrendingUp, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";

interface GifPickerProps {
  onSelect: (gif: { url: string; previewUrl: string; title: string }) => void;
  onClose: () => void;
}

interface GifResult {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
}

// Using Tenor API (free, no API key needed for basic usage with rate limits)
// For production, you'd want to use GIPHY or Tenor with proper API key
const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Public Google Tenor API key

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [trendingGifs, setTrendingGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"trending" | "search">("trending");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const parseGifResults = (results: any[]): GifResult[] => {
    return results.map((item) => {
      const gif = item.media_formats?.gif || item.media_formats?.tinygif;
      const preview = item.media_formats?.tinygif || item.media_formats?.nanogif;
      return {
        id: item.id,
        url: gif?.url || "",
        previewUrl: preview?.url || gif?.url || "",
        title: item.content_description || "",
        width: gif?.dims?.[0] || 200,
        height: gif?.dims?.[1] || 200,
      };
    });
  };

  const fetchTrending = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=30&media_filter=gif,tinygif`
      );
      if (!response.ok) throw new Error("Failed to fetch trending GIFs");
      const data = await response.json();
      setTrendingGifs(parseGifResults(data.results || []));
    } catch (err) {
      setError("Impossible de charger les GIFs");
      console.error("Error fetching trending GIFs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGifs([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=30&media_filter=gif,tinygif`
      );
      if (!response.ok) throw new Error("Failed to search GIFs");
      const data = await response.json();
      setGifs(parseGifResults(data.results || []));
    } catch (err) {
      setError("Erreur de recherche");
      console.error("Error searching GIFs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  useEffect(() => {
    if (debouncedSearch) {
      setActiveTab("search");
      searchGifs(debouncedSearch);
    } else {
      setActiveTab("trending");
    }
  }, [debouncedSearch, searchGifs]);

  const displayedGifs = activeTab === "search" ? gifs : trendingGifs;

  return (
    <div className="w-80 max-h-96 flex flex-col bg-popover rounded-lg border shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <span className="font-medium text-sm">GIFs</span>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un GIF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "trending" | "search")} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-9">
          <TabsTrigger 
            value="trending" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Tendances
          </TabsTrigger>
          {searchQuery && (
            <TabsTrigger 
              value="search"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Résultats
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 m-0 min-h-0">
          <ScrollArea className="h-56">
            {isLoading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full py-8 text-sm text-muted-foreground">
                {error}
              </div>
            ) : displayedGifs.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8 text-sm text-muted-foreground">
                {activeTab === "search" ? "Aucun GIF trouvé" : "Chargement..."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 p-2">
                {displayedGifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => onSelect({ url: gif.url, previewUrl: gif.previewUrl, title: gif.title })}
                    className="relative aspect-square overflow-hidden rounded hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={gif.previewUrl}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer - Tenor attribution */}
      <div className="p-2 border-t text-center">
        <span className="text-2xs text-muted-foreground">Propulsé par Tenor</span>
      </div>
    </div>
  );
}
