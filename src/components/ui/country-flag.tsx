import { Globe } from "lucide-react";
import { getCountryEmoji, getCountryPastelColor, extractCountryFromLocation } from "@/lib/countryUtils";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  country?: string | null;
  location?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showFallback?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "h-4 w-4 text-[10px]",
  sm: "h-5 w-5 text-xs",
  md: "h-6 w-6 text-sm",
  lg: "h-8 w-8 text-base",
};

const iconSizes = {
  xs: "h-2 w-2",
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function CountryFlag({
  country,
  location,
  size = "sm",
  showFallback = true,
  className,
}: CountryFlagProps) {
  // Try country first, then extract from location
  const resolvedCountry = country || extractCountryFromLocation(location);
  const emoji = getCountryEmoji(resolvedCountry);
  const pastelColor = getCountryPastelColor(resolvedCountry);

  if (!emoji) {
    if (!showFallback) return null;
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          sizeClasses[size],
          className
        )}
      >
        <Globe className={cn("text-muted-foreground", iconSizes[size])} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: pastelColor }}
      title={resolvedCountry || undefined}
    >
      <span className="leading-none">{emoji}</span>
    </div>
  );
}
