import { useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { getAllModules } from "@/lib/modulesData";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  module: string;
  description: string;
}

interface SolutionFeaturesProps {
  features: Feature[];
}

const moduleMap: Record<string, string> = {
  CRM: "crm",
  Projets: "projets",
  Commercial: "commercial",
  "Appels d'offres": "appels-offres",
  Planning: "planning",
  Collaboration: "collaboration",
};

export const SolutionFeatures = memo(({ features }: SolutionFeaturesProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const allModules = getAllModules();

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(".feature-card", { opacity: 1, y: 0 });
      
      gsap.fromTo(".feature-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const getModuleData = (moduleName: string) => {
    const moduleSlug = moduleMap[moduleName];
    return allModules.find((m) => m.slug === moduleSlug);
  };

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Nos solutions pour vous
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des modules pensés pour répondre à chacun de vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const moduleData = getModuleData(feature.module);
            const moduleSlug = moduleMap[feature.module];
            const ModuleIcon = moduleData?.icon;

            return (
              <Link
                key={index}
                to={moduleSlug ? `/modules/${moduleSlug}` : "#"}
                className="feature-card group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                {ModuleIcon && (
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${moduleData?.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <ModuleIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.module}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <div className="flex items-center gap-1 text-primary text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  En savoir plus
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});

SolutionFeatures.displayName = "SolutionFeatures";
