import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ModuleBenefit } from "@/lib/modulesData";

gsap.registerPlugin(ScrollTrigger);

interface ModuleBenefitsProps {
  benefits: ModuleBenefit[];
  color: string;
}

export const ModuleBenefits = ({ benefits, color }: ModuleBenefitsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".benefit-card", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        opacity: 0,
        scale: 0.9,
        stagger: 0.15,
        duration: 0.5,
        ease: "back.out(1.7)",
      });

      gsap.from(".benefit-value", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        textContent: 0,
        duration: 1.5,
        ease: "power2.out",
        snap: { textContent: 1 },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Résultats mesurables
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des bénéfices concrets pour votre agence
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="benefit-card text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all"
            >
              <div className={`text-5xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-2`}>
                {benefit.value}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
