import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Mail, Phone, Building2, MoreHorizontal, Pencil, Trash2, Eye, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRMStatusBadge } from "./CRMStatusBadge";

interface ContactMobileCardProps {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  companyName?: string | null;
  status?: "lead" | "confirmed" | string;
  typeBadge?: {
    label: string;
    color?: string;
  };
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
}

export function ContactMobileCard({
  id,
  name,
  role,
  email,
  phone,
  avatarUrl,
  companyName,
  status,
  typeBadge,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  onView,
  className,
}: ContactMobileCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "p-3 border-b border-border/50 bg-card transition-colors touch-manipulation",
        onClick && "cursor-pointer active:bg-muted/30",
        isSelected && "bg-muted/20",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {onSelect && (
          <div onClick={(e) => e.stopPropagation()} className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label={`Sélectionner ${name}`}
            />
          </div>
        )}

        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback className="text-xs font-medium bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{name}</p>
              {role && (
                <p className="text-xs text-muted-foreground truncate">{role}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {status && (
                <CRMStatusBadge status={status as any} size="sm" showIcon={false} />
              )}
              {typeBadge && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5"
                  style={typeBadge.color ? { backgroundColor: typeBadge.color, color: 'white' } : undefined}
                >
                  {typeBadge.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Company */}
          {companyName && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{companyName}</span>
            </div>
          )}

          {/* Contact info */}
          <div className="flex items-center gap-3 pt-0.5" onClick={(e) => e.stopPropagation()}>
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{email}</span>
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
        </div>

        {/* Actions */}
        {(onEdit || onDelete || onView) && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onView && (
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir détails
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

// Company variant
interface CompanyMobileCardProps {
  id: string;
  name: string;
  email?: string | null;
  city?: string | null;
  industry?: string | null;
  industryLabel?: string;
  industryColor?: string;
  primaryContactName?: string | null;
  status?: "lead" | "confirmed" | string;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function CompanyMobileCard({
  id,
  name,
  email,
  city,
  industry,
  industryLabel,
  industryColor,
  primaryContactName,
  status,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDelete,
  className,
}: CompanyMobileCardProps) {
  return (
    <div
      className={cn(
        "p-3 border-b border-border/50 bg-card transition-colors touch-manipulation",
        onClick && "cursor-pointer active:bg-muted/30",
        isSelected && "bg-muted/20",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {onSelect && (
          <div onClick={(e) => e.stopPropagation()} className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label={`Sélectionner ${name}`}
            />
          </div>
        )}

        {/* Company icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium shrink-0">
          {name.slice(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{name}</p>
              {city && (
                <p className="text-xs text-muted-foreground truncate">{city}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {status === "lead" && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 border-amber-500 text-amber-600 bg-amber-50"
                >
                  Lead
                </Badge>
              )}
              {industryLabel && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 text-white"
                  style={{ backgroundColor: industryColor || '#6B7280' }}
                >
                  {industryLabel}
                </Badge>
              )}
            </div>
          </div>

          {/* Primary contact */}
          {primaryContactName && (
            <p className="text-xs text-muted-foreground truncate">
              Contact: {primaryContactName}
            </p>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-3 w-3" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
