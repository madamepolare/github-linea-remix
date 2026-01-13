import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { IsometricModules } from "./illustrations/IsometricModules";
import { FloatingShapes } from "./illustrations/FloatingShapes";
import { AnimatedCounter } from "./AnimatedCounter";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden bg-pastel-cream">
      {/* Background shapes */}
      <FloatingShapes variant="hero" />

      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-border/40 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">
                Nouveau : IA intégrée pour les appels d'offres
              </span>
            </motion.div>

            {/* Main title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6"
            >
              Gérez vos projets{" "}
              <br className="hidden sm:block" />
              <span className="text-foreground/70">créatifs avec</span>
              <br />
              <span className="relative inline-block">
                élégance
                <motion.svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <motion.path
                    d="M2 8 Q50 2 100 8 T198 8"
                    fill="none"
                    stroke="hsl(210 80% 70%)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              La plateforme tout-en-un pour architectes, scénographes et agences créatives. 
              Projets, clients, devis et planning dans un espace unique.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <Link to="/auth">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 h-14 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium shadow-lg shadow-black/10"
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8 h-14 rounded-full font-medium border-2 hover:bg-white/50"
              >
                <Play className="mr-2 w-5 h-5" />
                Voir la démo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-8 lg:gap-12 justify-center lg:justify-start"
            >
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  <AnimatedCounter end={500} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">Agences</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  <AnimatedCounter end={15} suffix="K+" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">Projets gérés</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  <AnimatedCounter end={98} suffix="%" />
                </div>
                <div className="text-sm text-muted-foreground mt-1">Satisfaction</div>
              </div>
            </motion.div>
          </div>

          {/* Right content - Isometric illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <IsometricModules className="w-full h-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
