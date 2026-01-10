import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useDocumentationCategories,
  useDocumentationPages,
  DOCUMENTATION_PAGE_TYPES,
  DOCUMENTATION_TAGS,
} from "@/hooks/useDocumentation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategoryId?: string | null;
}

export function CreatePageDialog({
  open,
  onOpenChange,
  defaultCategoryId,
}: CreatePageDialogProps) {
  const navigate = useNavigate();
  const { categories } = useDocumentationCategories();
  const { createPage } = useDocumentationPages();

  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [pageType, setPageType] = useState("standard");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [emoji, setEmoji] = useState("");

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const result = await createPage.mutateAsync({
        title: title.trim(),
        slug: generateSlug(title),
        objective: objective.trim() || undefined,
        category_id: categoryId || undefined,
        page_type: pageType,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        emoji: emoji || undefined,
      });
      onOpenChange(false);
      resetForm();
      // Navigate to the new page
      navigate(`/documentation/${result.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setTitle("");
    setObjective("");
    setCategoryId(defaultCategoryId || "");
    setPageType("standard");
    setSelectedTags([]);
    setEmoji("");
  };

  const selectedPageType = DOCUMENTATION_PAGE_TYPES.find((t) => t.value === pageType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle page de documentation</DialogTitle>
          <DialogDescription>
            Créez une nouvelle page pour documenter vos processus, protocoles ou bonnes pratiques.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Emoji</Label>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder={selectedPageType?.icon || "📄"}
                className="w-16 text-center text-xl"
                maxLength={2}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="title">Titre de la page *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Onboarding nouveau collaborateur..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Objectif</Label>
            <Textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Quel est l'objectif de cette page ?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de page</Label>
              <Select value={pageType} onValueChange={setPageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENTATION_PAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENTATION_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTags.includes(tag.value) && tag.color
                  )}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                  {selectedTags.includes(tag.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createPage.isPending || !title.trim()}>
              {createPage.isPending ? "Création..." : "Créer la page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
