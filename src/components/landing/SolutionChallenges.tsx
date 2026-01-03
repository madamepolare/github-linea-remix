import { useEffect, useRef, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Challenge {
  title: string;
  description: string;
}

interface SolutionChallengesProps {
  challenges: Challenge[];
}

export const SolutionChallenges = memo(({ challenges }: SolutionChallengesProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(".challenge-card", { opacity: 1, x: 0 });
      
      gsap.fromTo(".challenge-card",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          duration: 0.5,
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
    <section ref={sectionRef} className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Vos défis quotidiens
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Nous comprenons les problématiques spécifiques de votre métier
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {challenges.map((challenge, index) => (
            <div
              key={index}
              className="challenge-card p-6 rounded-xl bg-card border border-border/50 hover:border-destructive/30 transition-colors"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {challenge.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {challenge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

SolutionChallenges.displayName = "SolutionChallenges";
