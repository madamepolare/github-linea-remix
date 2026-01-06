import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressResult {
  address: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect?: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
}

// Simple address autocomplete using data.gouv.fr API (no API key needed)
export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Rechercher une adresse...",
  className,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Using the French government address API (free, no API key)
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data.features || []);
        if (data.features?.length > 0) {
          setOpen(true);
        }
      } catch (error) {
        console.error("Address search error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelect = (feature: any) => {
    const props = feature.properties;
    const result: AddressResult = {
      address: props.name || props.label,
      city: props.city || "",
      postalCode: props.postcode || "",
      region: getRegionFromDepartment(props.context) || "",
      country: "France",
    };

    onChange(result.address);
    onAddressSelect?.(result);
    setOpen(false);
    setSuggestions([]);
  };

  // Extract region from context (format: "departmentCode, departmentName, regionName")
  const getRegionFromDepartment = (context: string): string => {
    if (!context) return "";
    const parts = context.split(", ");
    return parts[parts.length - 1] || "";
  };

  return (
    <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn("pl-9 pr-9", className)}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>Aucune adresse trouvée</CommandEmpty>
            <CommandGroup>
              {suggestions.map((feature, index) => (
                <CommandItem
                  key={index}
                  value={feature.properties.label}
                  onSelect={() => handleSelect(feature)}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {feature.properties.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {feature.properties.postcode} {feature.properties.city}
                      {feature.properties.context && (
                        <> - {feature.properties.context.split(", ").pop()}</>
                      )}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
