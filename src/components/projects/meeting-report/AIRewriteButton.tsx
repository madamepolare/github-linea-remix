import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIRewriteButtonProps {
  text: string;
  onRewrite: (newText: string) => void;
  context?: string;
}

export function AIRewriteButton({ text, onRewrite, context }: AIRewriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const rewriteStyles = [
    { id: "professional", label: "Plus professionnel", icon: "📝" },
    { id: "concise", label: "Plus concis", icon: "✂️" },
    { id: "detailed", label: "Plus détaillé", icon: "📋" },
    { id: "clear", label: "Plus clair", icon: "💡" },
  ];

  const handleRewrite = async (style: string) => {
    if (!text.trim()) {
      toast.error("Rien à réécrire");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-summary", {
        body: {
          type: "rewrite",
          text,
          style,
          context: context || "compte rendu de réunion de chantier architecture",
        },
      });

      if (error) throw error;
      if (data?.rewritten) {
        onRewrite(data.rewritten);
        toast.success("Texte reformulé");
        setOpen(false);
      }
    } catch (error) {
      console.error("Rewrite error:", error);
      toast.error("Erreur lors de la reformulation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          disabled={!text.trim()}
        >
          <Wand2 className="h-3.5 w-3.5" />
          IA
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="space-y-0.5">
          {rewriteStyles.map((style) => (
            <Button
              key={style.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8"
              onClick={() => handleRewrite(style.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <span className="mr-2">{style.icon}</span>
              )}
              {style.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
