import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { IsometricIllustration } from "../IsometricIllustration";

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  is_core: boolean;
  price_monthly: number;
  features: string[];
}

interface ModulesStepProps {
  modules: Module[];
  onNext: (selectedModules: string[]) => void;
  onBack: () => void;
  recommendedSlugs?: string[];
}

export function ModulesStep({ modules, onNext, onBack, recommendedSlugs = [] }: ModulesStepProps) {
  const [selected, setSelected] = useState<string[]>(() => {
    // Pre-select core modules and recommended ones
    const coreIds = modules.filter((m) => m.is_core).map((m) => m.id);
    const recommendedIds = modules.filter((m) => recommendedSlugs.includes(m.slug)).map((m) => m.id);
    return [...new Set([...coreIds, ...recommendedIds])];
  });

  const toggleModule = (moduleId: string, isCore: boolean) => {
    if (isCore) return;
    setSelected((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Box;
  };

  // Group modules: core first, then recommended, then others
  const coreModules = modules.filter((m) => m.is_core);
  const recommendedModules = modules.filter((m) => !m.is_core && recommendedSlugs.includes(m.slug));
  const otherModules = modules.filter((m) => !m.is_core && !recommendedSlugs.includes(m.slug));

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex-1 flex flex-col px-4 py-8"
    >
      <div className="text-center mb-8">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block text-sm font-medium text-muted-foreground mb-3"
        >
          Étape 3/4
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
        >
          Choisissez vos modules
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          Nous avons pré-sélectionné les modules adaptés à votre discipline
        </motion.p>
      </div>

      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full pb-4">
        {/* Core modules */}
        {coreModules.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              Modules essentiels (inclus)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {coreModules.map((module, idx) => {
                const Icon = getIcon(module.icon);
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="relative p-4 rounded-xl border-2 border-foreground/20 bg-foreground/5 text-left"
                  >
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-foreground" />
                    </div>
                    <Icon className="w-5 h-5 text-foreground mb-2" />
                    <div className="font-medium text-sm">{module.name}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended modules */}
        {recommendedModules.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Recommandés pour vous
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {recommendedModules.map((module, idx) => {
                const Icon = getIcon(module.icon);
                const isSelected = selected.includes(module.id);
                return (
                  <motion.button
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleModule(module.id, false)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all bg-white/50 backdrop-blur-sm",
                      isSelected
                        ? "border-amber-500 shadow-md"
                        : "border-border/50 hover:border-amber-500/50"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                    <Icon className={cn("w-5 h-5 mb-2", isSelected ? "text-amber-600" : "text-muted-foreground")} />
                    <div className="font-medium text-sm">{module.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{module.description}</div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Other modules */}
        {otherModules.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Autres modules disponibles
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {otherModules.map((module, idx) => {
                const Icon = getIcon(module.icon);
                const isSelected = selected.includes(module.id);
                return (
                  <motion.button
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.03 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleModule(module.id, false)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all bg-white/30",
                      isSelected
                        ? "border-foreground bg-white/50"
                        : "border-border/30 hover:border-foreground/30 hover:bg-white/40"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-foreground flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-background" />
                      </motion.div>
                    )}
                    <Icon className={cn("w-5 h-5 mb-2", isSelected ? "text-foreground" : "text-muted-foreground")} />
                    <div className="font-medium text-sm">{module.name}</div>
                    {module.price_monthly > 0 && (
                      <div className="text-xs text-primary mt-1">{module.price_monthly}€/mois</div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-between items-center pt-6 border-t border-border/50 max-w-4xl mx-auto w-full"
      >
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {selected.length} modules
          </span>
          <Button
            onClick={() => onNext(selected)}
            className="gap-2 h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
