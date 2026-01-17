import { useState } from "react";
import { Hash, Lock } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChannel: (data: {
    name: string;
    description?: string;
    channel_type: "public" | "private";
  }) => Promise<void>;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  onCreateChannel,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channelType, setChannelType] = useState<"public" | "private">("public");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onCreateChannel({
        name: name.toLowerCase().replace(/\s+/g, "-"),
        description: description || undefined,
        channel_type: channelType,
      });
      setName("");
      setDescription("");
      setChannelType("public");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un canal</DialogTitle>
          <DialogDescription>
            Les canaux sont l'endroit où votre équipe communique.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du canal</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: général"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert ce canal ?"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Visibilité</Label>
            <RadioGroup
              value={channelType}
              onValueChange={(v) => setChannelType(v as "public" | "private")}
              className="space-y-2"
            >
              <label
                className={cn(
                  "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                  channelType === "public" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="public" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span className="font-medium">Public</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tout le monde dans l'espace de travail peut voir et rejoindre ce canal
                  </p>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                  channelType === "private" && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value="private" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Privé</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Seuls les membres invités peuvent voir et rejoindre ce canal
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Création..." : "Créer le canal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
