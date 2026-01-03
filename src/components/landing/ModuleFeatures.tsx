import { useEffect, useRef, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
import { ModuleFeature } from "@/lib/modulesData";

gsap.registerPlugin(ScrollTrigger);

interface ModuleFeaturesProps {
  features: ModuleFeature[];
  color: string;
}

export const ModuleFeatures = memo(({ features, color }: ModuleFeaturesProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Set initial state explicitly to prevent flash
      gsap.set(".feature-item", { opacity: 1, y: 0 });
      
      gsap.fromTo(".feature-item", 
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
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

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Fonctionnalités clés
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour travailler efficacement
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-item group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

ModuleFeatures.displayName = "ModuleFeatures";
