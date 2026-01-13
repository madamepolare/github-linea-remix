import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Star, Crown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

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
}

const categoryLabels: Record<string, string> = {
  core: "Essentiels",
  finance: "Finance",
  business: "Business",
  productivity: "Productivité",
  hr: "Ressources Humaines",
  premium: "Premium",
};

const categoryOrder = ["core", "productivity", "finance", "business", "hr", "premium"];

export function ModulesStep({ modules, onNext, onBack }: ModulesStepProps) {
  const [selected, setSelected] = useState<string[]>(
    modules.filter((m) => m.is_core).map((m) => m.id)
  );

  const toggleModule = (moduleId: string, isCore: boolean) => {
    if (isCore) return; // Can't toggle core modules
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

  const groupedModules = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      modules: modules.filter((m) => m.category === cat),
    }))
    .filter((g) => g.modules.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col px-4 py-8 sm:py-12"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
        >
          <Star className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Choisissez vos modules</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Sélectionnez les fonctionnalités dont vous avez besoin. Vous pourrez modifier ce choix plus tard.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="space-y-8 pb-4">
          {groupedModules.map((group) => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">{group.label}</h3>
                {group.category === "premium" && (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.modules.map((module, idx) => {
                  const Icon = getIcon(module.icon);
                  const isSelected = selected.includes(module.id);
                  const isCore = module.is_core;

                  return (
                    <motion.button
                      key={module.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: isCore ? 1 : 1.02 }}
                      whileTap={{ scale: isCore ? 1 : 0.98 }}
                      onClick={() => toggleModule(module.id, isCore)}
                      disabled={isCore}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                        isCore && "opacity-80 cursor-default"
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </motion.div>
                      )}
                      {isCore && (
                        <span className="absolute top-2 right-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                          Inclus
                        </span>
                      )}
                      <Icon className={cn("w-6 h-6 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div className="font-semibold text-sm">{module.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {module.description}
                      </div>
                      {module.price_monthly > 0 && (
                        <div className="mt-2 text-xs font-medium text-primary">
                          {module.price_monthly}€/mois
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {selected.length} modules sélectionnés
          </span>
          <Button onClick={() => onNext(selected)} className="gap-2 h-12 px-6 rounded-xl">
            Continuer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
