import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Wand2, ExternalLink, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AutoSourceImageButtonProps {
  name: string;
  brand?: string;
  designer?: string;
  description?: string;
  onImageFound: (imageUrl: string) => void;
  disabled?: boolean;
}

interface SearchResult {
  success: boolean;
  searchUrl: string;
  suggestedKeywords: string[];
  productType: string;
  optimizedQuery: string;
  placeholderImage: string;
}

export function AutoSourceImageButton({
  name,
  brand,
  designer,
  description,
  onImageFound,
  disabled,
}: AutoSourceImageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleAutoSource = async () => {
    if (!name.trim()) {
      toast.error("Entrez d'abord un nom de produit");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-source-image", {
        body: { name, brand, designer, description },
      });

      if (error) throw error;

      if (data?.success) {
        setSearchResult(data);
        setOpen(true);
      } else {
        toast.error(data?.error || "Erreur lors de la recherche");
      }
    } catch (err) {
      console.error("Auto-source error:", err);
      toast.error("Erreur lors de la recherche d'image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePlaceholder = () => {
    if (searchResult?.placeholderImage) {
      onImageFound(searchResult.placeholderImage);
      toast.success("Image placeholder appliquée");
      setOpen(false);
    }
  };

  const handleOpenSearch = () => {
    if (searchResult?.searchUrl) {
      window.open(searchResult.searchUrl, "_blank");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAutoSource}
          disabled={disabled || isLoading || !name.trim()}
          title="Rechercher une image automatiquement"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Recherche d'image</h4>
            <p className="text-sm text-muted-foreground">
              Type de produit détecté : <strong>{searchResult?.productType}</strong>
            </p>
          </div>

          {searchResult?.suggestedKeywords && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mots-clés suggérés :</p>
              <div className="flex flex-wrap gap-1">
                {searchResult.suggestedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs bg-muted px-2 py-0.5 rounded"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {searchResult?.placeholderImage && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Image suggérée :</p>
              <img
                src={searchResult.placeholderImage}
                alt="Suggested"
                className="w-full h-32 object-cover rounded-lg border"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={handleUsePlaceholder}
              className="w-full"
            >
              <Image className="h-4 w-4 mr-2" />
              Utiliser cette image
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenSearch}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Rechercher sur Google Images
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Après avoir trouvé l'image souhaitée, copiez son URL et collez-la dans le champ.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
