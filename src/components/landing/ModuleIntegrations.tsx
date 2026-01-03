import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { getAllModules, type ModuleIntegration } from "@/lib/modulesData";

gsap.registerPlugin(ScrollTrigger);

interface ModuleIntegrationsProps {
  integrations: ModuleIntegration[];
  currentSlug: string;
}

export const ModuleIntegrations = ({ integrations, currentSlug }: ModuleIntegrationsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const allModules = getAllModules();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".integration-card", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        opacity: 0,
        x: -30,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const getModuleSlug = (moduleName: string): string | undefined => {
    const moduleMap: Record<string, string> = {
      "CRM": "crm",
      "Projets": "projets",
      "Commercial": "commercial",
      "Appels d'offres": "appels-offres",
      "Planning": "planning",
      "Collaboration": "collaboration",
    };
    return moduleMap[moduleName];
  };

  const getModuleData = (moduleName: string) => {
    const slug = getModuleSlug(moduleName);
    return allModules.find(m => m.slug === slug);
  };

  return (
    <section ref={containerRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Intégrations natives
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ce module s'intègre parfaitement avec les autres fonctionnalités de Linea Suite
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {integrations.map((integration) => {
            const moduleData = getModuleData(integration.module);
            const moduleSlug = getModuleSlug(integration.module);
            
            if (!moduleData || moduleSlug === currentSlug) return null;

            const Icon = moduleData.icon;
            
            return (
              <Link
                key={integration.module}
                to={`/modules/${moduleSlug}`}
                className="integration-card group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${moduleData.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {integration.module}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
