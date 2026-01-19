import { useState } from "react";
import { Plus, X, GripVertical, EyeOff, Eye, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

export interface ListItem {
  value: string;
  label: string;
  category?: string;
  description?: string;
  mandatory?: boolean;
}

interface CustomizableListEditorProps {
  title: string;
  description?: string;
  baseItems: ListItem[];
  customItems: ListItem[];
  hiddenItems: string[];
  onAddItem: (item: ListItem) => void;
  onRemoveCustomItem: (value: string) => void;
  onToggleHidden: (value: string, isHidden: boolean) => void;
  onReorder?: (items: ListItem[]) => void;
  showCategory?: boolean;
  categoryOptions?: { value: string; label: string }[];
  allowReorder?: boolean;
}

export function CustomizableListEditor({
  title,
  description,
  baseItems,
  customItems,
  hiddenItems,
  onAddItem,
  onRemoveCustomItem,
  onToggleHidden,
  onReorder,
  showCategory = false,
  categoryOptions = [],
  allowReorder = false,
}: CustomizableListEditorProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState(categoryOptions[0]?.value || "");
  const [isAdding, setIsAdding] = useState(false);

  // Combine base and custom items
  const allItems = [...baseItems, ...customItems];

  const handleAddItem = () => {
    if (!newLabel.trim()) return;
    
    const value = newLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    onAddItem({
      value: `custom_${value}`,
      label: newLabel.trim(),
      category: showCategory ? newCategory : undefined,
    });

    setNewLabel("");
    setIsAdding(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;
    
    const items = [...allItems];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(items);
  };

  const isCustomItem = (value: string) => value.startsWith("custom_");
  const isHidden = (value: string) => hiddenItems.includes(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className={cn(isAdding && "hidden")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {isAdding && (
        <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg bg-muted/30">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nouveau libellé..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            className="h-9 flex-1"
            autoFocus
          />
          {showCategory && categoryOptions.length > 0 && (
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-9 px-3 rounded-md border bg-background text-sm"
            >
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" onClick={handleAddItem} disabled={!newLabel.trim()}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="list-items" isDropDisabled={!allowReorder}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-1"
            >
              {allItems.map((item, index) => {
                const hidden = isHidden(item.value);
                const custom = isCustomItem(item.value);

                return (
                  <Draggable
                    key={item.value}
                    draggableId={item.value}
                    index={index}
                    isDragDisabled={!allowReorder}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg group transition-all",
                          hidden 
                            ? "bg-muted/30 opacity-50" 
                            : "bg-muted/50 hover:bg-muted",
                          snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                        )}
                      >
                        {allowReorder && (
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-background"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "font-medium text-sm",
                            hidden && "line-through text-muted-foreground"
                          )}>
                            {item.label}
                          </span>
                          {item.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {categoryOptions.find(c => c.value === item.category)?.label || item.category}
                            </Badge>
                          )}
                          {item.mandatory && (
                            <Badge className="ml-2 text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                              Obligatoire
                            </Badge>
                          )}
                          {custom && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Personnalisé
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => onToggleHidden(item.value, !hidden)}
                                >
                                  {hidden ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hidden ? "Réafficher" : "Masquer"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {custom && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => onRemoveCustomItem(item.value)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Supprimer</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {allItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Aucun élément configuré
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <EyeOff className="h-3 w-3" />
          <span>{hiddenItems.length} masqué(s)</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="h-4 text-[10px]">Perso</Badge>
          <span>{customItems.length} personnalisé(s)</span>
        </div>
      </div>
    </div>
  );
}