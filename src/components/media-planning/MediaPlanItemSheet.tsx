import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  Clock,
  FileText,
  Link,
  Megaphone,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { MediaPlanItem, MediaChannel, MEDIA_ITEM_STATUSES } from "@/hooks/useMediaPlanning";

interface MediaPlanItemSheetProps {
  item: (MediaPlanItem & { channel: MediaChannel | null; campaign?: { id: string; name: string } | null }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MediaPlanItemSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: MediaPlanItemSheetProps) {
  if (!item) return null;

  const statusConfig = MEDIA_ITEM_STATUSES.find((s) => s.value === item.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">{item.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {item.channel?.channel_type} • {item.format}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {statusConfig && (
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
          )}
        </SheetHeader>

        <Separator className="my-6" />

        <div className="space-y-6">
          {/* Date & Time */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Planification</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(item.publish_date), "EEEE dd MMMM yyyy", { locale: fr })}
                </span>
              </div>
              {item.publish_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{item.publish_time}</span>
                </div>
              )}
            </div>
          </div>

          {/* Campaign */}
          {item.campaign && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Campagne</h4>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{item.campaign.name}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
              <p className="text-sm whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Content Brief */}
          {item.content_brief && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Brief contenu</h4>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{item.content_brief}</p>
              </div>
            </div>
          )}

          {/* URL */}
          {item.content_url && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Lien</h4>
              <a
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Link className="h-4 w-4" />
                {item.content_url}
              </a>
            </div>
          )}

          {/* Channel */}
          {item.channel && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Canal</h4>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{item.channel.name}</p>
                  {item.channel.platform && (
                    <p className="text-xs text-muted-foreground">{item.channel.platform}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
