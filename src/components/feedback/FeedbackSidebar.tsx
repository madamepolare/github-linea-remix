import { useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Send, Bug, Lightbulb, MessageSquare, Trash2, ExternalLink, Copy, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeedbackMode } from "@/hooks/useFeedbackMode";
import { useFeedbackEntries, FeedbackEntry } from "@/hooks/useFeedbackEntries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-destructive" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-amber-500" },
  { value: "comment", label: "Commentaire", icon: MessageSquare, color: "text-blue-500" },
];

function formatFeedbacksAsPrompt(entries: FeedbackEntry[]): string {
  const groupedByRoute: Record<string, FeedbackEntry[]> = {};
  
  entries.forEach(entry => {
    if (!groupedByRoute[entry.route_path]) {
      groupedByRoute[entry.route_path] = [];
    }
    groupedByRoute[entry.route_path].push(entry);
  });

  let prompt = "Voici les améliorations à apporter à l'interface :\n\n";

  Object.entries(groupedByRoute).forEach(([route, feedbacks]) => {
    prompt += `## Page: ${route}\n\n`;
    feedbacks.forEach(fb => {
      const typeLabel = FEEDBACK_TYPES.find(t => t.value === fb.feedback_type)?.label || fb.feedback_type;
      prompt += `- [${typeLabel}] ${fb.content}\n`;
    });
    prompt += "\n";
  });

  return prompt;
}

export function FeedbackSidebar() {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useFeedbackMode();
  const { entries, createEntry, toggleResolved, deleteEntry, isLoading } = useFeedbackEntries();
  
  const [content, setContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [activeTab, setActiveTab] = useState("pending");

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createEntry.mutate({
      content: content.trim(),
      routePath: location.pathname,
      feedbackType,
    });
    
    setContent("");
  };

  const handleCopyPrompt = (onlyPending: boolean) => {
    const feedbacksToCopy = onlyPending 
      ? entries?.filter(e => !e.is_resolved) || []
      : entries || [];
    
    if (feedbacksToCopy.length === 0) {
      toast.error("Aucun feedback à copier");
      return;
    }

    const prompt = formatFeedbacksAsPrompt(feedbacksToCopy);
    navigator.clipboard.writeText(prompt);
    toast.success(`${feedbacksToCopy.length} feedback(s) copiés comme prompt !`);
  };

  if (!isSidebarOpen) return null;

  const getTypeConfig = (type: string) => 
    FEEDBACK_TYPES.find(t => t.value === type) || FEEDBACK_TYPES[1];

  const pendingEntries = entries?.filter(e => !e.is_resolved) || [];
  const resolvedEntries = entries?.filter(e => e.is_resolved) || [];

  const renderFeedbackCard = (entry: FeedbackEntry) => {
    const typeConfig = getTypeConfig(entry.feedback_type);
    return (
      <div 
        key={entry.id} 
        className={cn(
          "p-3 rounded-lg border bg-card space-y-2",
          entry.is_resolved && "opacity-60"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={() => toggleResolved.mutate({ id: entry.id, isResolved: !entry.is_resolved })}
            >
              {entry.is_resolved ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <typeConfig.icon className={cn("h-4 w-4", typeConfig.color)} />
            <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-background font-medium">
              {typeConfig.label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => deleteEntry.mutate(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        
        <p className={cn("text-sm", entry.is_resolved && "line-through")}>{entry.content}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">
            {entry.route_path}
          </code>
          <span>
            {format(new Date(entry.created_at), "d MMM HH:mm", { locale: fr })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "fixed top-0 right-0 z-40 h-full w-96 bg-background border-l shadow-xl",
        "transform transition-transform duration-300 ease-in-out",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold text-lg">Mode Feedback</h2>
          <p className="text-xs text-muted-foreground">Aidez-nous à améliorer l'interface</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Route */}
      <div className="p-4 bg-muted/50">
        <div className="flex items-center gap-2 text-sm">
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Page actuelle:</span>
          <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">
            {location.pathname}
          </code>
        </div>
      </div>

      {/* New Feedback Form */}
      <div className="p-4 space-y-3 border-b">
        <ToggleGroup 
          type="single" 
          value={feedbackType} 
          onValueChange={(v) => v && setFeedbackType(v)}
          className="justify-start"
        >
          {FEEDBACK_TYPES.map((type) => (
            <ToggleGroupItem 
              key={type.value} 
              value={type.value}
              className="gap-1.5 text-xs"
            >
              <type.icon className={cn("h-3.5 w-3.5", type.color)} />
              {type.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Textarea
          placeholder="Décrivez votre feedback..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
        />

        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || createEntry.isPending}
          className="w-full gap-2"
        >
          <Send className="h-4 w-4" />
          Envoyer
        </Button>
      </div>

      {/* Copy as Prompt Button */}
      <div className="p-3 border-b bg-primary/5">
        <Button 
          variant="outline" 
          className="w-full gap-2 text-sm"
          onClick={() => handleCopyPrompt(true)}
          disabled={pendingEntries.length === 0}
        >
          <Copy className="h-4 w-4" />
          Copier {pendingEntries.length} feedback(s) en attente pour Lovable
        </Button>
      </div>

      {/* Feedback List with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="mx-4 mt-3 shrink-0">
          <TabsTrigger value="pending" className="flex-1 gap-1.5">
            <Circle className="h-3 w-3" />
            En attente ({pendingEntries.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Faits ({resolvedEntries.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="pending" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : pendingEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun feedback en attente</p>
                ) : (
                  pendingEntries.map(renderFeedbackCard)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resolved" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : resolvedEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun feedback résolu</p>
                ) : (
                  resolvedEntries.map(renderFeedbackCard)
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}