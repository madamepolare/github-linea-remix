import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  ExternalLink,
  Download,
  Trash2,
  Edit,
  Lock,
  Eye,
} from "lucide-react";
import { ProjectElement } from "@/hooks/useProjectElements";
import { ELEMENT_TYPE_CONFIG, getElementTypeColor } from "@/lib/elementTypes";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ElementCardProps {
  element: ProjectElement;
  onEdit: (element: ProjectElement) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onView: (element: ProjectElement) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ElementCard({
  element,
  onEdit,
  onDelete,
  onTogglePin,
  onView,
  canEdit,
  canDelete,
}: ElementCardProps) {
  const typeConfig = ELEMENT_TYPE_CONFIG[element.element_type];
  const TypeIcon = typeConfig.icon;

  const handleOpen = () => {
    if (element.element_type === "link" && element.url) {
      window.open(element.url, "_blank");
    } else if (element.file_url) {
      window.open(element.file_url, "_blank");
    } else {
      onView(element);
    }
  };

  const handleDownload = () => {
    if (element.file_url) {
      const link = document.createElement("a");
      link.href = element.file_url;
      link.download = element.file_name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isRestricted = element.visibility !== "all";

  return (
    <Card
      className={cn(
        "group relative transition-all hover:shadow-md cursor-pointer",
        element.is_pinned && "ring-2 ring-primary/20 bg-primary/5"
      )}
      onClick={() => onView(element)}
    >
      {element.is_pinned && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Pin className="h-3 w-3" />
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              getElementTypeColor(element.element_type)
            )}
          >
            <TypeIcon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{element.title}</h4>
              {isRestricted && (
                <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            {element.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {element.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {typeConfig.label}
              </Badge>
              {element.category && (
                <Badge variant="outline" className="text-xs">
                  {element.category}
                </Badge>
              )}
              {element.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(element.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onView(element)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>

              {(element.element_type === "link" || element.file_url) && (
                <DropdownMenuItem onClick={handleOpen}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir
                </DropdownMenuItem>
              )}

              {element.file_url && (
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {canEdit && (
                <>
                  <DropdownMenuItem
                    onClick={() => onTogglePin(element.id, !element.is_pinned)}
                  >
                    {element.is_pinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Désépingler
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Épingler
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onEdit(element)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                </>
              )}

              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(element.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
