import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, AlertTriangle, Trash2, Calendar, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MeetingAttentionItem, CreateAttentionItemInput } from "@/hooks/useMeetingAttentionItems";

interface Company {
  id: string;
  name: string;
}

interface AttentionItemsSectionProps {
  items: MeetingAttentionItem[];
  companies: Company[];
  lots: { id: string; name: string; crm_company_id: string | null }[];
  meetingId: string;
  onCreateItem: (item: CreateAttentionItemInput) => void;
  onUpdateItem: (id: string, updates: Partial<MeetingAttentionItem>) => void;
  onDeleteItem: (id: string) => void;
}

const urgencyConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Faible", color: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  high: { label: "Urgent", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  critical: { label: "Critique", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  bet: { label: "BET", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  entreprise: { label: "Entreprise", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  moa: { label: "MOA", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  other: { label: "Autre", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
};

export function AttentionItemsSection({
  items,
  companies,
  lots,
  meetingId,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}: AttentionItemsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
    assignee_type: "all" | "specific" | "custom";
    assignee_company_ids: string[];
    assignee_names: string[];
    stakeholder_type: "bet" | "entreprise" | "moa" | "other";
    description: string;
    urgency: "low" | "normal" | "high" | "critical";
    due_date: string | null;
  }>({
    assignee_type: "all",
    assignee_company_ids: [],
    assignee_names: [],
    stakeholder_type: "entreprise",
    description: "",
    urgency: "normal",
    due_date: null,
  });
  const [customName, setCustomName] = useState("");

  // Get companies from lots for easier selection
  const lotCompanies = lots
    .filter(l => l.crm_company_id)
    .map(l => {
      const company = companies.find(c => c.id === l.crm_company_id);
      return company ? { ...company, lotName: l.name } : null;
    })
    .filter(Boolean) as (Company & { lotName: string })[];

  const handleAddItem = () => {
    if (!newItem.description.trim()) return;
    
    onCreateItem({
      meeting_id: meetingId,
      assignee_type: newItem.assignee_type,
      assignee_company_ids: newItem.assignee_company_ids,
      assignee_names: newItem.assignee_names,
      stakeholder_type: newItem.stakeholder_type,
      description: newItem.description,
      urgency: newItem.urgency,
      due_date: newItem.due_date,
      comment: null,
      progress: 0,
    });

    setNewItem({
      assignee_type: "all",
      assignee_company_ids: [],
      assignee_names: [],
      stakeholder_type: "entreprise",
      description: "",
      urgency: "normal",
      due_date: null,
    });
    setIsAddDialogOpen(false);
  };

  const toggleCompanySelection = (companyId: string) => {
    const ids = newItem.assignee_company_ids.includes(companyId)
      ? newItem.assignee_company_ids.filter(id => id !== companyId)
      : [...newItem.assignee_company_ids, companyId];
    setNewItem({ ...newItem, assignee_company_ids: ids, assignee_type: ids.length > 0 ? "specific" : "all" });
  };

  const addCustomName = () => {
    if (!customName.trim()) return;
    setNewItem({
      ...newItem,
      assignee_names: [...newItem.assignee_names, customName.trim()],
      assignee_type: "custom",
    });
    setCustomName("");
  };

  const getAssigneeDisplay = (item: MeetingAttentionItem) => {
    if (item.assignee_type === "all") {
      return "Tous";
    }
    if (item.assignee_type === "specific" && item.assignee_company_ids.length > 0) {
      const names = item.assignee_company_ids
        .map(id => companies.find(c => c.id === id)?.name || "?")
        .join(", ");
      return names;
    }
    if (item.assignee_names.length > 0) {
      return item.assignee_names.join(", ");
    }
    return "Non défini";
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
                  <Badge className={cn("text-xs", typeConfig[item.stakeholder_type]?.color)}>
                    {typeConfig[item.stakeholder_type]?.label}
                  </Badge>
                  <span className="font-medium text-sm flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {getAssigneeDisplay(item)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={item.urgency}
                    onValueChange={(v) => onUpdateItem(item.id, { urgency: v as MeetingAttentionItem["urgency"] })}
                  >
                    <SelectTrigger className="h-7 w-[90px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Urgent</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onDeleteItem(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <Textarea
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                placeholder="Description..."
                rows={2}
                className="resize-none text-sm"
              />

              {/* Footer row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <InlineDatePicker
                    value={item.due_date ? parseISO(item.due_date) : undefined}
                    onChange={(date) => onUpdateItem(item.id, { due_date: date?.toISOString().split('T')[0] || null })}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.progress}%</span>
                  <div className="flex gap-0.5">
                    {progressSteps.map((step) => (
                      <button
                        key={step}
                        type="button"
                        className={cn(
                          "w-5 h-2 rounded-sm transition-colors",
                          item.progress >= step ? "bg-primary" : "bg-muted"
                        )}
                        onClick={() => onUpdateItem(item.id, { progress: step })}
                        title={`${step}%`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <Input
                value={item.comment || ""}
                onChange={(e) => onUpdateItem(item.id, { comment: e.target.value })}
                placeholder="Commentaire..."
                className="h-8 text-sm"
              />
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Ajouter un point d'attention
      </Button>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau point d'attention</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Stakeholder type */}
            <div className="space-y-2">
              <Label>Type de destinataire</Label>
              <div className="flex gap-2 flex-wrap">
                {(["entreprise", "bet", "moa", "other"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={newItem.stakeholder_type === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewItem({ ...newItem, stakeholder_type: type })}
                  >
                    {typeConfig[type].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Assignees */}
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={newItem.assignee_type === "all" && newItem.assignee_company_ids.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewItem({ ...newItem, assignee_type: "all", assignee_company_ids: [], assignee_names: [] });
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Tous</span>
                </label>
                
                {lotCompanies.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    {lotCompanies.map((company) => (
                      <label key={company.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newItem.assignee_company_ids.includes(company.id)}
                          onCheckedChange={() => toggleCompanySelection(company.id)}
                        />
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{company.name}</span>
                        <span className="text-xs text-muted-foreground">({company.lotName})</span>
                      </label>
                    ))}
                  </>
                )}

                {/* Custom names */}
                {newItem.assignee_names.length > 0 && (
                  <>
                    <div className="border-t my-2" />
                    {newItem.assignee_names.map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setNewItem({
                            ...newItem,
                            assignee_names: newItem.assignee_names.filter((_, i) => i !== idx),
                          })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Add custom name */}
              <div className="flex gap-2">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ajouter un nom..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomName())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomName}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Description du point d'attention..."
                rows={3}
              />
            </div>

            {/* Urgency & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urgence</Label>
                <Select value={newItem.urgency} onValueChange={(v) => setNewItem({ ...newItem, urgency: v as typeof newItem.urgency })}>
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
                  onChange={(date) => setNewItem({ ...newItem, due_date: date?.toISOString().split('T')[0] || null })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddItem} disabled={!newItem.description.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
