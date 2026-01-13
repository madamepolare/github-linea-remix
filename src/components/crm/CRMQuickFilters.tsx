import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Check,
  ChevronDown,
  Filter,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  color?: string;
  count?: number;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CRMQuickFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  types?: FilterOption[];
  selectedTypes?: string[];
  onTypesChange?: (types: string[]) => void;
  quickFilters?: QuickFilter[];
  activeQuickFilter?: string;
  onQuickFilterChange?: (filterId: string | null) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  onClearAllFilters?: () => void;
  totalCount?: number;
  filteredCount?: number;
}

export function CRMQuickFilters({
  search,
  onSearchChange,
  categories = [],
  selectedCategory = "all",
  onCategoryChange,
  types = [],
  selectedTypes = [],
  onTypesChange,
  quickFilters = [],
  activeQuickFilter,
  onQuickFilterChange,
  placeholder = "Rechercher...",
  showAdvancedFilters = false,
  onClearAllFilters,
  totalCount,
  filteredCount,
}: CRMQuickFiltersProps) {
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);

  const hasActiveFilters = search || selectedCategory !== "all" || selectedTypes.length > 0 || activeQuickFilter;

  const handleTypeToggle = (typeId: string) => {
    if (!onTypesChange) return;
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    onTypesChange(newTypes);
  };

  return (
    <div className="space-y-3">
      {/* Search bar row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Type multi-select filter */}
        {types.length > 0 && onTypesChange && (
          <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-1.5",
                  selectedTypes.length > 0 && "border-primary"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Type
                {selectedTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {selectedTypes.length}
                  </Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Filtrer les types..." />
                <CommandList>
                  <CommandEmpty>Aucun type trouvé</CommandEmpty>
                  <CommandGroup>
                    {types.map((type) => (
                      <CommandItem
                        key={type.id}
                        value={type.id}
                        onSelect={() => handleTypeToggle(type.id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            selectedTypes.includes(type.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {selectedTypes.includes(type.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          {type.color && (
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                          )}
                          <span className="text-sm">{type.label}</span>
                        </div>
                        {type.count !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {type.count}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
              {selectedTypes.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      onTypesChange([]);
                      setTypePopoverOpen(false);
                    }}
                  >
                    Effacer la sélection
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Advanced filters button */}
        {showAdvancedFilters && (
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Plus de filtres
          </Button>
        )}

        {/* Clear all button */}
        {hasActiveFilters && onClearAllFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-foreground"
            onClick={onClearAllFilters}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Effacer
          </Button>
        )}

        {/* Count indicator */}
        {filteredCount !== undefined && totalCount !== undefined && filteredCount !== totalCount && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filteredCount} sur {totalCount}
          </span>
        )}
      </div>

      {/* Category chips row */}
      {categories.length > 0 && onCategoryChange && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs gap-1.5 transition-all",
                selectedCategory === cat.id && "shadow-sm"
              )}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.color && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              )}
              {cat.label}
              {cat.count !== undefined && cat.count > 0 && (
                <Badge
                  variant={selectedCategory === cat.id ? "secondary" : "outline"}
                  className="ml-0.5 h-4 px-1 text-[10px]"
                >
                  {cat.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Quick filters row */}
      {quickFilters.length > 0 && onQuickFilterChange && (
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filtres rapides:</span>
          <div className="flex items-center gap-1.5">
            {quickFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeQuickFilter === filter.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 text-xs",
                  activeQuickFilter === filter.id && "bg-secondary"
                )}
                onClick={() => 
                  onQuickFilterChange(activeQuickFilter === filter.id ? null : filter.id)
                }
              >
                {filter.icon}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
