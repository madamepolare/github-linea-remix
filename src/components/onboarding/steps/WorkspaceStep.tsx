import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Building2, Users, Briefcase, Home } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceStepProps {
  onNext: (data: { name: string; type: string }) => void;
  onBack: () => void;
}

const workspaceTypes = [
  { id: "agency", label: "Agence", icon: Briefcase, description: "Architectes, designers, consultants" },
  { id: "company", label: "Entreprise", icon: Building2, description: "PME, startups, grands groupes" },
  { id: "freelance", label: "Freelance", icon: Home, description: "Travailleur indépendant" },
  { id: "team", label: "Équipe", icon: Users, description: "Département ou équipe projet" },
];

export function WorkspaceStep({ onNext, onBack }: WorkspaceStepProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const canContinue = name.trim().length >= 2 && type;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <Building2 className="w-8 h-8 text-primary" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Créez votre workspace</h2>
          <p className="text-muted-foreground">Donnez un nom à votre espace et choisissez son type</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <Label htmlFor="workspace-name" className="text-base font-medium">
              Nom du workspace
            </Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon Agence, Studio Design..."
              className="h-14 text-lg rounded-xl border-2 focus:border-primary"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Type d'organisation</Label>
            <div className="grid grid-cols-2 gap-3">
              {workspaceTypes.map((wt) => (
                <motion.button
                  key={wt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setType(wt.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    type === wt.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <wt.icon className={cn("w-6 h-6 mb-2", type === wt.id ? "text-primary" : "text-muted-foreground")} />
                  <div className="font-semibold">{wt.label}</div>
                  <div className="text-xs text-muted-foreground">{wt.description}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-10">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            onClick={() => onNext({ name, type })}
            disabled={!canContinue}
            className="gap-2 h-12 px-6 rounded-xl"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
