import { useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleData } from "@/lib/modulesData";

interface ModuleHeroProps {
  module: ModuleData;
}

export const ModuleHero = memo(({ module }: ModuleHeroProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const Icon = module.icon;

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      // Set initial visible state to prevent flash/overlap issues
      gsap.set([".hero-badge", ".hero-title", ".hero-description", ".hero-cta", ".hero-icon"], {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
      });

      gsap.fromTo(".hero-badge", 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(".hero-title", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(".hero-description", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power3.out" }
      );

      gsap.fromTo(".hero-cta", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(".hero-icon", 
        { opacity: 0, scale: 0.5, rotation: -15 },
        { opacity: 1, scale: 1, rotation: 0, duration: 0.8, delay: 0.3, ease: "back.out(1.7)" }
      );
    }, heroRef);

    return () => ctx.revert();
  }, [module.slug]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-24 pb-16"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-5`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Back link */}
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{module.subtitle}</span>
          </div>

          {/* Icon */}
          <div className="hero-icon flex justify-center mb-8">
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-2xl`}>
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="hero-title text-4xl md:text-6xl font-bold text-foreground mb-6">
            {module.title}
          </h1>

          {/* Description */}
          <p className="hero-description text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {module.description}
          </p>

          {/* CTA */}
          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8" asChild>
              <Link to="/onboarding">Essayer gratuitement</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <Link to="/welcome#pricing">Voir les tarifs</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
});

ModuleHero.displayName = "ModuleHero";
