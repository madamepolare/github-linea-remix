import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";

interface WorkspaceStepProps {
  onNext: (data: { name: string; type: string }) => void;
  onBack: () => void;
}

export function WorkspaceStep({ onNext, onBack }: WorkspaceStepProps) {
  const [name, setName] = useState("");

  const canContinue = name.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex-1 flex items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-sm font-medium text-muted-foreground mb-3"
          >
            Étape 2/4
          </motion.span>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-foreground/10 flex items-center justify-center"
          >
            <Building2 className="w-8 h-8 text-foreground" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
          >
            Nommez votre workspace
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Le nom de votre agence ou entreprise
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <Label htmlFor="workspace-name" className="text-base font-medium">
              Nom du workspace
            </Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Studio Dupont Architecture"
              className="h-14 text-lg rounded-xl border-2 bg-white/50 backdrop-blur-sm focus:border-foreground focus:bg-white transition-all"
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Vous pourrez modifier ce nom plus tard
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between mt-10"
        >
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            onClick={() => onNext({ name, type: "agency" })}
            disabled={!canContinue}
            className="gap-2 h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
