import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { FormDialog } from "@/components/ui/patterns";
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
import { IDEA_CATEGORIES, CreateIdeaInput } from "@/hooks/useRoadmap";

interface SubmitIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateIdeaInput) => void;
  isLoading?: boolean;
}

export function SubmitIdeaDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: SubmitIdeaDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("feature");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
    });
    setTitle("");
    setDescription("");
    setCategory("feature");
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Proposer une idée"
      description="Partagez votre idée pour améliorer Linea. Les meilleures suggestions seront intégrées à la roadmap."
      submitLabel="Soumettre"
      isSubmitting={isLoading}
      submitDisabled={!title.trim()}
      onSubmit={handleSubmit}
      size="md"
    >
      <div className="flex items-center gap-2 text-primary mb-2">
        <Lightbulb className="h-5 w-5" />
        <span className="text-sm font-medium">Nouvelle idée</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          placeholder="Ex: Intégration avec Notion"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Décrivez votre idée en détail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IDEA_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  );
}
