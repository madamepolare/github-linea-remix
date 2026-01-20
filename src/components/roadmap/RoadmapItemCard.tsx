import { ChevronUp, ExternalLink, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RoadmapItem, ROADMAP_STATUSES } from "@/hooks/useRoadmap";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@/hooks/usePermissions";

interface RoadmapItemCardProps {
  item: RoadmapItem;
  onVote?: (itemId: string, remove: boolean) => void;
  onStatusChange?: (itemId: string, status: RoadmapItem['status']) => void;
  showVotes?: boolean;
  onClick?: () => void;
  feedbackCount?: number;
}

export function RoadmapItemCard({ 
  item, 
  onVote, 
  onStatusChange,
  showVotes = true, 
  onClick, 
  feedbackCount = 0 
}: RoadmapItemCardProps) {
  const statusConfig = ROADMAP_STATUSES.find(s => s.value === item.status);
  const { isAdmin, isOwner } = usePermissions();
  const canChangeStatus = (isAdmin || isOwner) && onStatusChange && !item.id.startsWith('static-');

  const getModuleHref = () => {
    if (!item.module_slug) return null;
    const slugMap: Record<string, string> = {
      dashboard: '/dashboard',
      crm: '/crm',
      projects: '/projects',
      tasks: '/tasks',
      commercial: '/commercial',
      tenders: '/tenders',
      invoicing: '/invoicing',
      messages: '/messages',
      notifications: '/notifications',
      team: '/team',
      reports: '/reports',
      chantier: '/chantier',
      documents: '/documents',
      portal: '/client-portal',
      libraries: '/materials',
      ai: '/dashboard',
      permissions: '/settings',
    };
    return slugMap[item.module_slug] || null;
  };

  const href = getModuleHref();

  const StatusBadge = () => (
    <Badge className={cn("shrink-0 text-xs", statusConfig?.color)}>
      {statusConfig?.label}
    </Badge>
  );

  return (
    <div 
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Vote button */}
      {showVotes && onVote && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(item.id, !!item.user_voted);
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors shrink-0",
            item.user_voted
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}
        >
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs font-semibold">{item.votes_count}</span>
        </button>
      )}

      {/* Icon */}
      {item.icon && (
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          item.status === 'delivered' ? "bg-green-500/10" : "bg-muted"
        )}>
          <DynamicIcon 
            name={item.icon} 
            className={cn(
              "h-5 w-5",
              item.status === 'delivered' ? "text-green-600" : "text-muted-foreground"
            )} 
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{item.title}</h3>
            {feedbackCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                <MessageSquare className="h-3 w-3" />
                {feedbackCount}
              </span>
            )}
            {href && item.status === 'delivered' && (
              <Link 
                to={href} 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </Link>
            )}
          </div>
          
          {canChangeStatus ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="focus:outline-none">
                  <StatusBadge />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {ROADMAP_STATUSES.map((status) => (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(item.id, status.value as RoadmapItem['status']);
                    }}
                    className={cn(
                      "cursor-pointer",
                      item.status === status.value && "bg-accent"
                    )}
                  >
                    <span className={cn("px-2 py-0.5 rounded text-xs", status.color)}>
                      {status.label}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <StatusBadge />
          )}
        </div>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
        )}
        {item.quarter && (
          <p className="text-xs text-muted-foreground mt-2">Prévu: {item.quarter}</p>
        )}
      </div>
    </div>
  );
}
