import { useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Send, Bug, Lightbulb, MessageSquare, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFeedbackMode } from "@/hooks/useFeedbackMode";
import { useFeedbackEntries } from "@/hooks/useFeedbackEntries";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug", icon: Bug, color: "text-destructive" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-amber-500" },
  { value: "comment", label: "Commentaire", icon: MessageSquare, color: "text-blue-500" },
];

export function FeedbackSidebar() {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useFeedbackMode();
  const { entries, createEntry, deleteEntry, isLoading } = useFeedbackEntries();
  
  const [content, setContent] = useState("");
  const [feedbackType, setFeedbackType] = useState("suggestion");

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createEntry.mutate({
      content: content.trim(),
      routePath: location.pathname,
      feedbackType,
    });
    
    setContent("");
  };

  if (!isSidebarOpen) return null;

  const getTypeConfig = (type: string) => 
    FEEDBACK_TYPES.find(t => t.value === type) || FEEDBACK_TYPES[1];

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

      {/* Feedback List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Feedbacks récents ({entries?.length || 0})
          </h3>
          
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : entries?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun feedback pour le moment</p>
          ) : (
            entries?.map((entry) => {
              const typeConfig = getTypeConfig(entry.feedback_type);
              return (
                <div 
                  key={entry.id} 
                  className="p-3 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <typeConfig.icon className={cn("h-4 w-4", typeConfig.color)} />
                      <Badge variant="outline" className="text-[10px]">
                        {typeConfig.label}
                      </Badge>
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
                  
                  <p className="text-sm">{entry.content}</p>
                  
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
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
