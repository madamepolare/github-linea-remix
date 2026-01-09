import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Send,
  FileText,
  CheckCircle2,
  Loader2,
  Search,
  FileSearch,
  Zap,
  Bot,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TenderAskDCEDialogProps {
  tenderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

export function TenderAskDCEDialog({
  tenderId,
  open,
  onOpenChange,
}: TenderAskDCEDialogProps) {
  const { documents } = useTenderDocuments(tenderId);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "found">("idle");
  const [scannedDocIds, setScannedDocIds] = useState<string[]>([]);
  const [currentScanDoc, setCurrentScanDoc] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scan state when dialog opens
  useEffect(() => {
    if (open) {
      setScanPhase("idle");
      setScannedDocIds([]);
      setCurrentScanDoc(null);
    }
  }, [open]);

  // Simulate document scanning animation
  useEffect(() => {
    if (isSearching && documents.length > 0 && scanPhase === "scanning") {
      let currentIndex = 0;
      const scanInterval = setInterval(() => {
        if (currentIndex < documents.length) {
          const doc = documents[currentIndex];
          setCurrentScanDoc(doc.id);
          
          setTimeout(() => {
            setScannedDocIds((prev) => [...prev, doc.id]);
          }, 400);
          
          currentIndex++;
        } else {
          clearInterval(scanInterval);
        }
      }, 600);

      return () => clearInterval(scanInterval);
    }
  }, [isSearching, documents, scanPhase]);

  const handleAsk = async () => {
    if (!question.trim() || isSearching) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsSearching(true);
    setScanPhase("scanning");
    setScannedDocIds([]);

    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-tender-documents",
        {
          body: {
            tenderId,
            question: userMessage.content,
          },
        }
      );

      if (error) throw error;

      setScanPhase("found");
      
      // Small delay to show "found" state
      await new Promise((r) => setTimeout(r, 500));

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: data?.answer || "Je n'ai pas pu trouver de réponse dans les documents.",
        sources: data?.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Erreur lors de l'analyse des documents");
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: "Désolé, une erreur s'est produite lors de l'analyse. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSearching(false);
      setScanPhase("idle");
      setCurrentScanDoc(null);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg">Question au DCE</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                {documents.length} document{documents.length > 1 ? "s" : ""} disponible{documents.length > 1 ? "s" : ""}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && !isSearching && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <FileSearch className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Posez une question sur le DCE</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  L'assistant analysera vos documents pour trouver la réponse et citer ses sources.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {[
                    "Quel est le délai d'exécution ?",
                    "Quelles sont les pénalités de retard ?",
                    "Y a-t-il une visite obligatoire ?",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setQuestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message list */}
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-4",
                      message.type === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-1.5">Sources :</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs bg-background/50"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.type === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Scanning Animation */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl p-4 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Search className="h-5 w-5 text-primary" />
                    </motion.div>
                    <span className="text-sm font-medium text-primary">
                      {scanPhase === "found" ? "Réponse trouvée !" : "Recherche dans les documents..."}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const isScanned = scannedDocIds.includes(doc.id);
                      const isScanning = currentScanDoc === doc.id;

                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: isScanned || isScanning ? 1 : 0.5 }}
                          className="flex items-center gap-3"
                        >
                          <FileText
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isScanned
                                ? "text-green-500"
                                : isScanning
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{doc.file_name}</p>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                              <motion.div
                                className={cn(
                                  "h-full rounded-full",
                                  isScanned
                                    ? "bg-green-500"
                                    : "bg-gradient-to-r from-primary to-purple-500"
                                )}
                                initial={{ width: "0%" }}
                                animate={{
                                  width: isScanned ? "100%" : isScanning ? "70%" : "0%",
                                }}
                                transition={{ duration: 0.4 }}
                              />
                            </div>
                          </div>
                          {isScanned && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </motion.div>
                          )}
                          {isScanning && !isScanned && (
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {scanPhase === "found" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 flex items-center justify-center gap-2 text-green-600"
                    >
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Génération de la réponse...</span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Posez votre question sur le DCE..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              disabled={isSearching || documents.length === 0}
            />
            <Button
              size="icon"
              className="h-[60px] w-[60px] shrink-0 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              onClick={handleAsk}
              disabled={!question.trim() || isSearching || documents.length === 0}
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          {documents.length === 0 && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              Uploadez des documents dans l'onglet DCE pour poser des questions
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
