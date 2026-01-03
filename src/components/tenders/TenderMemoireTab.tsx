import { useState } from "react";
import {
  PenTool,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  GripVertical,
  BookOpen,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenderSections, SECTION_TYPES } from "@/hooks/useTenderSections";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { cn } from "@/lib/utils";

interface TenderMemoireTabProps {
  tenderId: string;
}

export function TenderMemoireTab({ tenderId }: TenderMemoireTabProps) {
  const { sections, isLoading, addSection, updateSection, deleteSection, generateWithAI } = useTenderSections(tenderId);
  const { entries: knowledgeEntries } = useKnowledgeBase();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({ section_type: "presentation", title: "" });

  const handleAdd = () => {
    const typeLabel = SECTION_TYPES.find(t => t.value === newSection.section_type)?.label || "";
    addSection.mutate({
      section_type: newSection.section_type,
      title: newSection.title || typeLabel,
    });
    setShowAddDialog(false);
    setNewSection({ section_type: "presentation", title: "" });
  };

  const handleInsertKnowledge = (content: string) => {
    if (activeSection) {
      const section = sections.find(s => s.id === activeSection);
      if (section) {
        updateSection.mutate({
          id: activeSection,
          content: (section.content || "") + "\n\n" + content,
        });
      }
    }
    setShowKnowledgeDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mémoire Technique</h2>
          <p className="text-sm text-muted-foreground">
            Rédigez votre mémoire technique avec l'assistance de l'IA
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune section créée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commencez par ajouter des sections à votre mémoire
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      {section.title}
                      {section.ai_generated && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveSection(section.id);
                        setShowKnowledgeDialog(true);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Base
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateWithAI.mutate({ 
                        sectionId: section.id, 
                        sectionType: section.section_type 
                      })}
                      disabled={generateWithAI.isPending}
                    >
                      {generateWithAI.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Générer
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteSection.mutate(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={section.content || ""}
                  onChange={(e) => updateSection.mutate({ id: section.id, content: e.target.value })}
                  placeholder="Rédigez le contenu de cette section..."
                  rows={8}
                  className="resize-y"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Section Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de section</Label>
              <Select
                value={newSection.section_type}
                onValueChange={(v) => setNewSection({ ...newSection, section_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titre personnalisé (optionnel)</Label>
              <Input
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                placeholder="Laisser vide pour utiliser le titre par défaut"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Knowledge Base Dialog */}
      <Dialog open={showKnowledgeDialog} onOpenChange={setShowKnowledgeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Base de connaissances</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {knowledgeEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune entrée dans la base de connaissances
              </p>
            ) : (
              knowledgeEntries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleInsertKnowledge(entry.content || "")}
                >
                  <CardContent className="py-3">
                    <p className="font-medium text-sm">{entry.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {entry.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
