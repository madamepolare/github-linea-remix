import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SolutionData } from "@/lib/solutionsData";

gsap.registerPlugin(ScrollTrigger);

interface SolutionHeroProps {
  solution: SolutionData;
}

// Get pastel background color based on solution
const getSolutionBgColor = (color: string): string => {
  if (color.includes("blue")) return "bg-pastel-blue";
  if (color.includes("pink") || color.includes("rose")) return "bg-pastel-pink";
  if (color.includes("green") || color.includes("emerald")) return "bg-pastel-mint";
  if (color.includes("purple") || color.includes("violet")) return "bg-pastel-lavender";
  if (color.includes("orange") || color.includes("amber")) return "bg-pastel-peach";
  return "bg-pastel-cream";
};

export const SolutionHero = ({ solution }: SolutionHeroProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const Icon = solution.icon;
  const bgColor = getSolutionBgColor(solution.color);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax effect on scroll
      gsap.to(".hero-bg-shape", {
        y: 100,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, [solution.slug]);

  return (
    <section
      ref={heroRef}
      className={`relative min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden pt-20 sm:pt-24 pb-16 ${bgColor}`}
    >
      {/* Background shapes */}
      <div className="hero-bg-shape absolute top-1/4 -left-20 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full bg-white/30 blur-3xl" />
      <div className="hero-bg-shape absolute bottom-0 right-0 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] rounded-full bg-white/20 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </motion.div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
            <span className="text-sm font-medium text-foreground/80">{solution.subtitle}</span>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-foreground flex items-center justify-center shadow-2xl shadow-black/20">
              <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-background" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight"
          >
            {solution.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-4"
          >
            {solution.description}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
          >
            <Link to="/onboarding">
              <Button
                size="lg"
                className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-sm sm:text-base"
              >
                Démarrer gratuitement
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <Link to="/welcome#pricing">
              <Button
                size="lg"
                variant="outline"
                className="h-12 sm:h-14 px-6 sm:px-8 rounded-full border-2 hover:bg-white/50 font-medium text-sm sm:text-base"
              >
                Voir les tarifs
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
