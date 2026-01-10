import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  Briefcase,
  Users,
  CheckSquare,
  Wrench,
  Layers,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DocumentationCategory } from "@/hooks/useDocumentation";
import { THIN_STROKE } from "@/components/ui/icon";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  agency: Briefcase,
  projects: Layers,
  roles: Users,
  checklists: CheckSquare,
  tools: Wrench,
  default: FileText,
};

interface DocumentationSidebarProps {
  categories: DocumentationCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onCreateCategory: () => void;
}

export function DocumentationSidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
}: DocumentationSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build tree structure
  const rootCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const CategoryItem = ({
    category,
    depth = 0,
  }: {
    category: DocumentationCategory;
    depth?: number;
  }) => {
    const children = getChildren(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const IconComponent = CATEGORY_ICONS[category.icon || "default"] || FileText;

    return (
      <div>
        <div
          className={cn(
            "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors",
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          <button
            className="flex-1 flex items-center gap-2 text-left"
            onClick={() => onSelectCategory(category.id)}
          >
            <IconComponent className="h-4 w-4 shrink-0" strokeWidth={THIN_STROKE} />
            <span className="truncate">{category.name}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {children.map((child) => (
                <CategoryItem key={child.id} category={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Catégories</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCreateCategory}
          >
            <FolderPlus className="h-4 w-4" strokeWidth={THIN_STROKE} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All pages option */}
          <button
            className={cn(
              "w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors",
              selectedCategoryId === null
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => onSelectCategory(null)}
          >
            <BookOpen className="h-4 w-4" strokeWidth={THIN_STROKE} />
            <span>Toutes les pages</span>
          </button>

          {/* Category tree */}
          {rootCategories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}

          {categories.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-4">
              Aucune catégorie
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
