import { motion } from "framer-motion";
import { Eye, Clock, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentationPage, DOCUMENTATION_TAGS, DOCUMENTATION_PAGE_TYPES } from "@/hooks/useDocumentation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DocumentationPageCardProps {
  page: DocumentationPage;
  onClick: () => void;
}

export function DocumentationPageCard({ page, onClick }: DocumentationPageCardProps) {
  const pageType = DOCUMENTATION_PAGE_TYPES.find((t) => t.value === page.page_type);
  const checklistProgress = page.checklist?.length
    ? {
        completed: page.checklist.filter((item) => item.checked).length,
        total: page.checklist.length,
      }
    : null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className="cursor-pointer h-full hover:border-primary/50 transition-colors group"
        onClick={onClick}
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{page.emoji || pageType?.icon || "📄"}</span>
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {page.title}
                </h3>
                {page.category && (
                  <p className="text-xs text-muted-foreground truncate">
                    {page.category.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {page.objective && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
              {page.objective}
            </p>
          )}

          {/* Checklist progress */}
          {checklistProgress && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">
                  {checklistProgress.completed}/{checklistProgress.total}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${(checklistProgress.completed / checklistProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {page.tags && page.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {page.tags.slice(0, 3).map((tag) => {
                const tagConfig = DOCUMENTATION_TAGS.find((t) => t.value === tag);
                return (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn("text-[10px] px-1.5 py-0", tagConfig?.color)}
                  >
                    {tagConfig?.label || tag}
                  </Badge>
                );
              })}
              {page.tags.length > 3 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  +{page.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{page.view_count || 0}</span>
            </div>
            {page.updated_at && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(page.updated_at), "d MMM", { locale: fr })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
