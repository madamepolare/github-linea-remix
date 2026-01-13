import { useEffect, useRef, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Benefit {
  value: string;
  label: string;
}

interface SolutionBenefitsProps {
  benefits: Benefit[];
  color: string;
}

export const SolutionBenefits = memo(({ benefits }: SolutionBenefitsProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Animate cards
      gsap.from(".benefit-stat", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
        },
      });

      // Animate counter values
      gsap.utils.toArray<HTMLElement>(".stat-value").forEach((el) => {
        const value = el.dataset.value || "0";
        const numValue = parseInt(value.replace(/\D/g, ""));
        const suffix = value.replace(/[0-9]/g, "");
        
        if (numValue > 0) {
          gsap.fromTo(
            el,
            { innerText: "0" },
            {
              innerText: numValue,
              duration: 2,
              ease: "power2.out",
              snap: { innerText: 1 },
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
              },
              onUpdate: function () {
                el.innerText = Math.round(parseFloat(el.innerText)) + suffix;
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="benefit-stat bg-pastel-cream rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center hover:shadow-lg hover:shadow-black/5 transition-all duration-300"
            >
              <div
                className="stat-value text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2"
                data-value={benefit.value}
              >
                {benefit.value}
              </div>
              <div className="text-sm sm:text-base text-muted-foreground">
                {benefit.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

SolutionBenefits.displayName = "SolutionBenefits";
