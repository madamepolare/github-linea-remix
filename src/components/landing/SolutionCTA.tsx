import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingShapes } from "./illustrations/FloatingShapes";

interface SolutionCTAProps {
  color: string;
}

export const SolutionCTA = memo(({ color }: SolutionCTAProps) => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-pastel-cream relative overflow-hidden">
      <FloatingShapes variant="section" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Prêt à transformer votre pratique ?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm sm:text-base">
            Rejoignez les professionnels qui ont déjà optimisé leur gestion avec
            LINEA.
          </p>
          <Link to="/onboarding">
            <Button
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-sm sm:text-base"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

SolutionCTA.displayName = "SolutionCTA";
