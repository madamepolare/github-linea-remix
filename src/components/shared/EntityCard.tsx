import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EntityCardAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
}

export interface EntityCardMetadata {
  icon: React.ElementType;
  label: string;
  value: string;
  onClick?: () => void;
}

interface EntityCardProps {
  // Avatar
  avatar?: {
    src?: string | null;
    fallback: string;
    className?: string;
  };

  // Header
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    color?: string;
    variant?: "default" | "secondary" | "outline";
  };

  // Content
  children?: React.ReactNode;
  metadata?: EntityCardMetadata[];

  // Selection
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  showCheckbox?: boolean;

  // Actions
  onClick?: () => void;
  actions?: EntityCardAction[];

  // Styling
  className?: string;
  compact?: boolean;
}

export function EntityCard({
  avatar,
  title,
  subtitle,
  badge,
  children,
  metadata,
  isSelected,
  onSelect,
  showCheckbox = true,
  onClick,
  actions,
  className,
  compact = false,
}: EntityCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on checkbox or actions
    if ((e.target as HTMLElement).closest("[data-no-card-click]")) {
      return;
    }
    onClick?.();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border bg-card transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20",
        isSelected && "border-primary/50 bg-primary/5",
        compact && "p-3",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {showCheckbox && onSelect && (
          <div
            data-no-card-click
            className={cn(
              "pt-0.5 transition-opacity",
              !isSelected && "opacity-0 group-hover:opacity-100"
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="h-4 w-4"
            />
          </div>
        )}

        {/* Avatar */}
        {avatar && (
          <Avatar className={cn("h-10 w-10 shrink-0", avatar.className)}>
            {avatar.src && <AvatarImage src={avatar.src} alt={title} />}
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {avatar.fallback || getInitials(title)}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {badge && (
                <Badge
                  variant={badge.variant || "secondary"}
                  className="text-[10px] px-1.5 py-0"
                  style={
                    badge.color
                      ? { backgroundColor: `${badge.color}20`, color: badge.color }
                      : undefined
                  }
                >
                  {badge.label}
                </Badge>
              )}

              {/* Actions dropdown */}
              {actions && actions.length > 0 && (
                <div data-no-card-click>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {actions.map((action, index) => {
                        const Icon = action.icon;
                        const isDestructive = action.variant === "destructive";
                        const showSeparator =
                          isDestructive &&
                          index > 0 &&
                          actions[index - 1]?.variant !== "destructive";

                        return (
                          <React.Fragment key={action.id}>
                            {showSeparator && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={action.onClick}
                              className={cn(
                                isDestructive &&
                                  "text-destructive focus:text-destructive"
                              )}
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {action.label}
                            </DropdownMenuItem>
                          </React.Fragment>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {/* Custom content */}
          {children}

          {/* Metadata */}
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {metadata.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-1 text-xs text-muted-foreground",
                      item.onClick && "cursor-pointer hover:text-primary"
                    )}
                    onClick={(e) => {
                      if (item.onClick) {
                        e.stopPropagation();
                        item.onClick();
                      }
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{item.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
