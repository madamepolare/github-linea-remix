import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className, size }: DynamicIconProps) {
  // Convert icon name to match lucide-react exports (e.g., "file-text" -> "FileText")
  const iconName = name
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('') as keyof typeof LucideIcons;

  const IconComponent = LucideIcons[iconName] as LucideIcon;

  if (!IconComponent) {
    // Fallback to a default icon
    const FallbackIcon = LucideIcons.Circle;
    return <FallbackIcon className={cn("h-4 w-4", className)} size={size} />;
  }

  return <IconComponent className={cn("h-4 w-4", className)} size={size} />;
}
