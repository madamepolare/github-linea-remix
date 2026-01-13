import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Building2, Sofa, Theater, Megaphone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DisciplineStepProps {
  onNext: (disciplineId: string) => void;
  onBack: () => void;
  disciplines: { id: string; name: string; slug: string; description: string }[];
}

const DISCIPLINE_CONFIG: Record<string, { icon: any; gradient: string; description: string }> = {
  architecture: {
    icon: Building2,
    gradient: "from-blue-500 to-cyan-500",
    description: "Projets de construction, rénovation et urbanisme",
  },
  interior: {
    icon: Sofa,
    gradient: "from-amber-500 to-orange-500",
    description: "Aménagement d'espaces résidentiels et commerciaux",
  },
  scenography: {
    icon: Theater,
    gradient: "from-purple-500 to-pink-500",
    description: "Événements, expositions et scénographies",
  },
  communication: {
    icon: Megaphone,
    gradient: "from-emerald-500 to-teal-500",
    description: "Agences de communication et marketing",
  },
};

export function DisciplineStep({ onNext, onBack, disciplines }: DisciplineStepProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex-1 flex items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-sm font-medium text-muted-foreground mb-3"
          >
            Étape 1/4
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
          >
            Quelle est votre discipline ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-md mx-auto"
          >
            Nous adapterons les modules et fonctionnalités recommandés
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {disciplines?.filter(d => d.slug in DISCIPLINE_CONFIG).map((discipline, idx) => {
            const config = DISCIPLINE_CONFIG[discipline.slug];
            const Icon = config?.icon || Building2;
            const isSelected = selected === discipline.id;

            return (
              <motion.button
                key={discipline.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(discipline.id)}
                className={cn(
                  "relative p-6 rounded-2xl border-2 text-left transition-all bg-white/50 backdrop-blur-sm",
                  isSelected
                    ? "border-foreground shadow-lg"
                    : "border-border/50 hover:border-foreground/30 hover:shadow-md"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="discipline-indicator"
                    className="absolute inset-0 rounded-2xl bg-foreground/5"
                  />
                )}
                <div className="relative">
                  <div className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                    config?.gradient || "from-gray-500 to-gray-600"
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {discipline.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {config?.description || discipline.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
            onClick={handleContinue}
            disabled={!selected}
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
