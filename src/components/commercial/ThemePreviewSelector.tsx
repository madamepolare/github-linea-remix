import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Check,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuoteThemes, QuoteTheme } from '@/hooks/useQuoteThemes';

interface ThemePreviewSelectorProps {
  selectedThemeId: string | null;
  onThemeChange: (themeId: string | null) => void;
  compact?: boolean;
}

export function ThemePreviewSelector({
  selectedThemeId,
  onThemeChange,
  compact = false,
}: ThemePreviewSelectorProps) {
  const { themes, isLoading } = useQuoteThemes();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const currentIndex = themes.findIndex(t => t.id === selectedThemeId);
  const currentTheme = currentIndex >= 0 ? themes[currentIndex] : null;
  const defaultTheme = themes.find(t => t.is_default);

  const handlePrevious = () => {
    if (themes.length === 0) return;
    const newIndex = currentIndex <= 0 ? themes.length - 1 : currentIndex - 1;
    onThemeChange(themes[newIndex].id);
  };

  const handleNext = () => {
    if (themes.length === 0) return;
    const newIndex = currentIndex >= themes.length - 1 ? 0 : currentIndex + 1;
    onThemeChange(themes[newIndex].id);
  };

  const handleSelectTheme = (themeId: string) => {
    onThemeChange(themeId);
    setPopoverOpen(false);
  };

  if (isLoading || themes.length === 0) {
    return null;
  }

  // If no theme selected, use default
  if (!selectedThemeId && defaultTheme) {
    onThemeChange(defaultTheme.id);
  }

  return (
    <div className={cn(
      "flex items-center gap-1 bg-muted/50 rounded-lg p-1",
      compact ? "text-xs" : "text-sm"
    )}>
      {/* Previous button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("shrink-0", compact ? "h-6 w-6" : "h-7 w-7")}
        onClick={handlePrevious}
        disabled={themes.length <= 1}
      >
        <ChevronLeft className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
      </Button>

      {/* Theme name with popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-1.5 min-w-0 max-w-[140px] px-2",
              compact ? "h-6 text-xs" : "h-7 text-sm"
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              {/* Color preview dots */}
              {currentTheme && (
                <div className="flex gap-0.5 shrink-0">
                  <div 
                    className="w-2 h-2 rounded-full border border-white/50"
                    style={{ backgroundColor: currentTheme.primary_color }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full border border-white/50"
                    style={{ backgroundColor: currentTheme.accent_color }}
                  />
                </div>
              )}
              <span className="truncate">
                {currentTheme?.name || 'Thème par défaut'}
              </span>
            </div>
            {currentTheme?.is_ai_generated && (
              <Sparkles className="h-3 w-3 text-purple-500 shrink-0" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="center">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4" />
              Thèmes de devis
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="p-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors",
                    theme.id === selectedThemeId 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  {/* Color dots */}
                  <div className="flex gap-0.5 shrink-0">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: theme.primary_color }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: theme.accent_color }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: theme.background_color }}
                    />
                  </div>

                  {/* Theme info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium truncate">{theme.name}</span>
                      {theme.is_default && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                      {theme.is_ai_generated && (
                        <Sparkles className="h-3 w-3 text-purple-500 shrink-0" />
                      )}
                    </div>
                    {theme.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {theme.description}
                      </p>
                    )}
                  </div>

                  {/* Check mark */}
                  {theme.id === selectedThemeId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Next button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("shrink-0", compact ? "h-6 w-6" : "h-7 w-7")}
        onClick={handleNext}
        disabled={themes.length <= 1}
      >
        <ChevronRight className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
      </Button>

      {/* Theme counter */}
      <Badge variant="secondary" className={cn("ml-1", compact ? "text-[10px] px-1 py-0" : "text-xs")}>
        {currentIndex + 1}/{themes.length}
      </Badge>
    </div>
  );
}
