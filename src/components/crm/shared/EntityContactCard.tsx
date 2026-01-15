import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EntityContactCardProps {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  badge?: {
    label: string;
    color?: string;
  };
  isPrimary?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  compact?: boolean;
}

export function EntityContactCard({
  name,
  role,
  email,
  phone,
  avatarUrl,
  badge,
  isPrimary = false,
  onClick,
  onEdit,
  onDelete,
  className,
  compact = false,
}: EntityContactCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasActions = onEdit || onDelete;
  const hasContactInfo = email || phone;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border bg-card transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50",
        isPrimary && "ring-1 ring-primary/20 bg-primary/5",
        className
      )}
      onClick={onClick}
    >
      <Avatar className={cn(compact ? "h-8 w-8" : "h-10 w-10", "shrink-0")}>
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="text-xs font-medium bg-muted">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className={cn("font-medium truncate", compact ? "text-sm" : "text-sm")}>
            {name}
          </p>
          {isPrimary && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              Principal
            </Badge>
          )}
          {badge && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 shrink-0"
              style={badge.color ? { borderColor: badge.color, color: badge.color } : undefined}
            >
              {badge.label}
            </Badge>
          )}
        </div>

        {role && (
          <p className="text-xs text-muted-foreground truncate">{role}</p>
        )}

        {hasContactInfo && !compact && (
          <div className="flex items-center gap-3 pt-1" onClick={(e) => e.stopPropagation()}>
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                title={email}
              >
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{email}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3" />
                {phone}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Quick action buttons on hover (compact mode) */}
      {compact && hasContactInfo && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          {email && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={`mailto:${email}`}>
                <Mail className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {phone && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={`tel:${phone}`}>
                <Phone className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Actions dropdown */}
      {hasActions && (
        <div onClick={(e) => e.stopPropagation()}>
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
            <DropdownMenuContent align="end" className="w-36">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>Modifier</DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
