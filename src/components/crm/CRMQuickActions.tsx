import { useState } from "react";
import { Building2, User, Target, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface CRMQuickActionsProps {
  onCreateCompany: () => void;
  onCreateContact: () => void;
  onCreateLead: () => void;
}

export function CRMQuickActions({
  onCreateCompany,
  onCreateContact,
  onCreateLead,
}: CRMQuickActionsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const actions: QuickAction[] = [
    {
      id: "company",
      label: "Entreprise",
      icon: Building2,
      color: "text-info",
      bgColor: "bg-info/10 hover:bg-info/20",
      onClick: onCreateCompany,
    },
    {
      id: "contact",
      label: "Contact",
      icon: User,
      color: "text-accent",
      bgColor: "bg-accent/10 hover:bg-accent/20",
      onClick: onCreateContact,
    },
    {
      id: "lead",
      label: "Opportunité",
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10 hover:bg-success/20",
      onClick: onCreateLead,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Ajout rapide :</span>
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs font-medium transition-all",
              action.bgColor,
              action.color
            )}
            onClick={action.onClick}
            onMouseEnter={() => setHoveredId(action.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <action.icon className="h-3.5 w-3.5" />
            <span>{action.label}</span>
            <Plus
              className={cn(
                "h-3 w-3 transition-transform",
                hoveredId === action.id ? "rotate-90" : ""
              )}
            />
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
