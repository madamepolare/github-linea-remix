import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Rocket, Check, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CompleteStepProps {
  workspaceName: string;
  modulesCount: number;
  invitesCount: number;
  onComplete: () => void;
  isLoading: boolean;
}

export function CompleteStep({
  workspaceName,
  modulesCount,
  invitesCount,
  onComplete,
  isLoading,
}: CompleteStepProps) {
  useEffect(() => {
    // Trigger confetti on mount
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#8b5cf6", "#06b6d4", "#10b981"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#8b5cf6", "#06b6d4", "#10b981"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const summaryItems = [
    { label: "Workspace", value: workspaceName },
    { label: "Modules activés", value: `${modulesCount} modules` },
    { label: "Invitations", value: invitesCount > 0 ? `${invitesCount} envoyée${invitesCount > 1 ? "s" : ""}` : "Aucune" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex items-center justify-center px-4 py-12"
    >
      <div className="max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center"
        >
          <PartyPopper className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl sm:text-5xl font-bold mb-4"
        >
          C'est prêt ! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8"
        >
          Votre workspace est configuré et prêt à l'emploi
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border p-6 mb-8"
        >
          <h3 className="font-semibold mb-4 text-left">Récapitulatif</h3>
          <div className="space-y-3">
            {summaryItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            size="lg"
            onClick={onComplete}
            disabled={isLoading}
            className="h-14 px-10 text-lg font-semibold rounded-2xl gap-3 group"
          >
            {isLoading ? (
              "Création en cours..."
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Accéder à mon workspace
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
