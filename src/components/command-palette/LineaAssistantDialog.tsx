import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, Loader2, X, MessageSquare, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LineaAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestion?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLE_QUESTIONS = [
  "Quel est le CA total de cette année ?",
  "Combien de projets en cours ?",
  "Quel client a le plus de factures ?",
  "Comparaison du CA avec l'année dernière",
  "Quels sont les projets les plus rentables ?",
  "Combien d'heures passées ce mois-ci ?",
];

export function LineaAssistantDialog({ 
  open, 
  onOpenChange,
  initialQuestion = "" 
}: LineaAssistantDialogProps) {
  const { activeWorkspace } = useAuth();
  const [question, setQuestion] = useState(initialQuestion);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (q?: string) => {
    const questionToAsk = q || question;
    if (!questionToAsk.trim() || !activeWorkspace?.id) return;

    const userMessage: Message = { role: "user", content: questionToAsk };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("linea-assistant", {
        body: {
          question: questionToAsk,
          workspaceId: activeWorkspace.id,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer || "Désolé, je n'ai pas pu répondre.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking Linea:", error);
      toast.error("Erreur lors de la communication avec Linea");
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setMessages([]);
      setQuestion("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span>Linea Assistant</span>
            <span className="text-xs text-muted-foreground font-normal">
              Posez n'importe quelle question sur vos données
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 mb-4">
                <MessageSquare className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Comment puis-je vous aider ?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Je peux analyser vos données pour répondre à vos questions sur le CA, les clients, les projets, et plus encore.
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Exemples de questions</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {EXAMPLE_QUESTIONS.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleAsk(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Linea analyse vos données...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Posez votre question à Linea..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => handleAsk()}
                disabled={!question.trim() || isLoading}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
