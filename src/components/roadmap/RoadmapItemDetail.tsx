import { useState } from "react";
import { Send, MessageSquare, User, Clock, Trash2, Copy, Check, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useRoadmapFeedback, RoadmapFeedback } from "@/hooks/useRoadmapFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ROADMAP_STATUSES } from "@/hooks/useRoadmap";
import { toast } from "sonner";

interface RoadmapItemDetailProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    status: string;
    category: string;
    module_slug?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoadmapItemDetail({ item, open, onOpenChange }: RoadmapItemDetailProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Check if this is a static item (not in database)
  const isStaticItem = item?.id.startsWith('static-') || false;
  
  const { feedbacks, isLoading, createFeedback, deleteFeedback, markAsResolved } = useRoadmapFeedback(
    isStaticItem ? null : (item?.id || null), 
    item?.module_slug || null
  );

  const handleSubmit = () => {
    if (!content.trim() || !item || isStaticItem) return;
    createFeedback.mutate(
      { roadmapItemId: item.id, content: content.trim() },
      { onSuccess: () => setContent("") }
    );
  };

  const handleCopyFeedbacks = () => {
    if (feedbacks.length === 0) return;
    
    const prompt = `# Retours pour: ${item?.title}

${feedbacks.map(fb => `- "${fb.content}" 
  Par: ${fb.author?.full_name || 'Anonyme'} 
  Date: ${format(new Date(fb.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
  ${fb.source === 'feedback_mode' ? `Route: ${fb.route_path}` : ''}`).join('\n\n')}
`;
    
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success(`${feedbacks.length} retour(s) copié(s) !`);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = (status: string) =>
    ROADMAP_STATUSES.find((s) => s.value === status) || ROADMAP_STATUSES[1];

  if (!item) return null;

  const statusConfig = getStatusConfig(item.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            {item.icon && (
              <div className={cn(
                "p-2 rounded-lg",
                item.color ? `bg-${item.color}-500/10` : "bg-primary/10"
              )}>
                <DynamicIcon 
                  name={item.icon} 
                  className={cn(
                    "h-5 w-5",
                    item.color ? `text-${item.color}-600` : "text-primary"
                  )} 
                />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <SheetTitle className="text-left">{item.title}</SheetTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Feedback Form - only for non-static items */}
          {isStaticItem ? (
            <div className="p-4 border-b bg-muted/30">
              <p className="text-sm text-muted-foreground text-center">
                💡 Utilisez le <strong>Mode Feedback</strong> sur la page du module pour laisser un retour
              </p>
            </div>
          ) : (
            <div className="p-4 border-b space-y-3 bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Donnez votre retour
              </div>
              <Textarea
                placeholder="Partagez votre expérience, vos suggestions d'amélioration..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || createFeedback.isPending}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            </div>
          )}

          {/* Feedbacks List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b bg-background flex items-center justify-between">
              <span className="text-sm font-medium">
                Retours ({feedbacks.length})
              </span>
              {feedbacks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleCopyFeedbacks}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copier tout
                    </>
                  )}
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : feedbacks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun retour pour le moment</p>
                    <p className="text-xs">Soyez le premier à partager votre avis !</p>
                  </div>
                ) : (
                  feedbacks.map((feedback) => (
                    <FeedbackCard
                      key={feedback.id}
                      feedback={feedback}
                      isOwner={feedback.user_id === user?.id}
                      onDelete={() => deleteFeedback.mutate(feedback.id)}
                      onToggleResolved={(isResolved) => 
                        markAsResolved.mutate({ feedbackId: feedback.id, isResolved })
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface FeedbackCardProps {
  feedback: RoadmapFeedback;
  isOwner: boolean;
  onDelete: () => void;
  onToggleResolved: (isResolved: boolean) => void;
}

function FeedbackCard({ feedback, isOwner, onDelete, onToggleResolved }: FeedbackCardProps) {
  const isFeedbackMode = feedback.source === 'feedback_mode';
  const isResolved = (feedback as any).is_resolved;
  
  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card space-y-2",
      isResolved && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isFeedbackMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 shrink-0"
              onClick={() => onToggleResolved(!isResolved)}
            >
              {isResolved ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}
          <Avatar className="h-6 w-6">
            <AvatarImage src={feedback.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {feedback.author?.full_name?.charAt(0) || <User className="h-3 w-3" />}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {feedback.author?.full_name || "Utilisateur"}
          </span>
          {isFeedbackMode && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              via Mode Feedback
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(feedback.created_at), "d MMM HH:mm", { locale: fr })}
          </span>
          {isOwner && feedback.source === 'roadmap' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      {isFeedbackMode && feedback.route_path && (
        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
          {feedback.route_path}
        </code>
      )}
      <p className={cn("text-sm whitespace-pre-wrap", isResolved && "line-through")}>
        {feedback.content}
      </p>
    </div>
  );
}
