import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { IsometricIllustration } from "../IsometricIllustration";

interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex items-center justify-center px-4 py-8"
    >
      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex-shrink-0"
        >
          <IsometricIllustration type="workspace" className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80" />
        </motion.div>

        {/* Content */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Configuration en 2 minutes
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            Bienvenue sur<br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              LINEA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0"
          >
            Configurons votre espace de travail pour une expérience sur-mesure adaptée à votre métier.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={onNext}
              className="h-14 px-8 text-lg font-semibold rounded-full bg-foreground text-background hover:bg-foreground/90 gap-3 group shadow-lg"
            >
              C'est parti
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Sans engagement
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Essai gratuit
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
