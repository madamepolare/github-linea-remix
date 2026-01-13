import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2, Check, Upload, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyLogoSearchProps {
  companyName: string;
  website?: string | null;
  currentLogo?: string | null;
  onLogoFound: (url: string) => void;
  disabled?: boolean;
}

export function CompanyLogoSearch({
  companyName,
  website,
  currentLogo,
  onLogoFound,
  disabled = false,
}: CompanyLogoSearchProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [foundLogo, setFoundLogo] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setFoundLogo(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-company-logo', {
        body: { companyName, website }
      });

      if (fnError) throw fnError;

      if (data.success && data.logoUrl) {
        setFoundLogo(data.logoUrl);
        toast.success("Logo trouvé !");
      } else {
        setError(data.message || "Aucun logo trouvé");
      }
    } catch (err) {
      console.error('Error fetching logo:', err);
      setError("Erreur lors de la recherche");
      toast.error("Erreur lors de la recherche du logo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseLogo = (url: string) => {
    onLogoFound(url);
    setIsOpen(false);
    setFoundLogo(null);
    setManualUrl("");
    toast.success("Logo appliqué");
  };

  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      handleUseLogo(manualUrl.trim());
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" />
          Rechercher logo
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Recherche automatique</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Recherche du logo de "{companyName}" sur internet
            </p>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>

          {foundLogo && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">Logo trouvé :</p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                  <img
                    src={foundLogo}
                    alt="Logo trouvé"
                    className="h-full w-full object-contain"
                    onError={() => setError("Impossible de charger l'image")}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => handleUseLogo(foundLogo)}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Utiliser
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
              {error}
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">URL manuelle</h4>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/logo.png"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleManualSubmit}
                disabled={!manualUrl.trim()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentLogo && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Logo actuel :</p>
              <div className="h-10 w-10 rounded-lg bg-white border overflow-hidden">
                <img
                  src={currentLogo}
                  alt="Logo actuel"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
