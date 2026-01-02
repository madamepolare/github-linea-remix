import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, AlertTriangle, Trash2, Building2, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttentionItem {
  id: string;
  assignee_name: string;
  assignee_type: "bet" | "entreprise" | "moa" | "other";
  description: string;
  urgency: "low" | "normal" | "high" | "critical";
  due_date: string | null;
  comment: string;
  progress: number; // 0-100
}

interface AttentionItemsSectionProps {
  items: AttentionItem[];
  onAddItem: (item: Omit<AttentionItem, "id">) => void;
  onUpdateItem: (id: string, updates: Partial<AttentionItem>) => void;
  onRemoveItem: (id: string) => void;
  attendeeNames: { name: string; type: string }[];
}

const urgencyConfig: Record<AttentionItem["urgency"], { label: string; color: string; bgColor: string }> = {
  low: { label: "Faible", color: "text-muted-foreground", bgColor: "bg-muted" },
  normal: { label: "Normal", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  high: { label: "Urgent", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  critical: { label: "Critique", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  bet: { label: "BET", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  entreprise: { label: "Entreprise", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  moa: { label: "MOA", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  other: { label: "Autre", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export function AttentionItemsSection({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  attendeeNames,
}: AttentionItemsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<AttentionItem, "id">>({
    assignee_name: "",
    assignee_type: "entreprise",
    description: "",
    urgency: "normal",
    due_date: null,
    comment: "",
    progress: 0,
  });

  const handleAddItem = () => {
    if (!newItem.assignee_name.trim() || !newItem.description.trim()) return;
    onAddItem(newItem);
    setNewItem({
      assignee_name: "",
      assignee_type: "entreprise",
      description: "",
      urgency: "normal",
      due_date: null,
      comment: "",
      progress: 0,
    });
    setIsAddDialogOpen(false);
  };

  const progressSteps = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun point d'attention</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 space-y-3 bg-card">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-xs", typeConfig[item.assignee_type]?.color)}>
                    {typeConfig[item.assignee_type]?.label}
                  </Badge>
                  <span className="font-medium text-sm">{item.assignee_name}</span>
                  <Badge className={cn("text-xs", urgencyConfig[item.urgency].bgColor, urgencyConfig[item.urgency].color)}>
                    {urgencyConfig[item.urgency].label}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveItem(item.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>

              {/* Description */}
              <Textarea
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                placeholder="Description du point..."
                rows={2}
                className="resize-none text-sm"
              />

              {/* Meta row */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Due date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <InlineDatePicker
                    value={item.due_date ? parseISO(item.due_date) : undefined}
                    onChange={(date) => onUpdateItem(item.id, { due_date: date?.toISOString() || null })}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Urgency */}
                <Select
                  value={item.urgency}
                  onValueChange={(value) => onUpdateItem(item.id, { urgency: value as AttentionItem["urgency"] })}
                >
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Urgent</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avancement</span>
                  <span className="text-xs font-medium">{item.progress}%</span>
                </div>
                <div className="flex gap-1">
                  {progressSteps.map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={cn(
                        "flex-1 h-2 rounded-full transition-colors",
                        item.progress >= step ? "bg-primary" : "bg-muted"
                      )}
                      onClick={() => onUpdateItem(item.id, { progress: step })}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-2" />
                <Textarea
                  value={item.comment}
                  onChange={(e) => onUpdateItem(item.id, { comment: e.target.value })}
                  placeholder="Commentaire..."
                  rows={1}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Ajouter un point d'attention
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau point d'attention</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newItem.assignee_type}
                  onValueChange={(v) => setNewItem({ ...newItem, assignee_type: v as AttentionItem["assignee_type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entreprise">Entreprise</SelectItem>
                    <SelectItem value="bet">BET</SelectItem>
                    <SelectItem value="moa">MOA</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Destinataire</Label>
                {attendeeNames.length > 0 ? (
                  <Select value={newItem.assignee_name} onValueChange={(v) => setNewItem({ ...newItem, assignee_name: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {attendeeNames.map((a) => (
                        <SelectItem key={a.name} value={a.name}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={newItem.assignee_name}
                    onChange={(e) => setNewItem({ ...newItem, assignee_name: e.target.value })}
                    placeholder="Nom du destinataire"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Description du point d'attention..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urgence</Label>
                <Select value={newItem.urgency} onValueChange={(v) => setNewItem({ ...newItem, urgency: v as AttentionItem["urgency"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Urgent</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Échéance</Label>
                <InlineDatePicker
                  value={newItem.due_date ? parseISO(newItem.due_date) : undefined}
                  onChange={(date) => setNewItem({ ...newItem, due_date: date?.toISOString() || null })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddItem} disabled={!newItem.assignee_name.trim() || !newItem.description.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
