import { useEffect, useRef, memo } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { getAllSolutions } from "@/lib/solutionsData";

gsap.registerPlugin(ScrollTrigger);

interface SolutionOthersProps {
  currentSlug: string;
}

const solutionColors: Record<string, string> = {
  architectes: "bg-pastel-blue",
  "architectes-interieur": "bg-pastel-pink",
  scenographes: "bg-pastel-lavender",
  "agences-communication": "bg-pastel-peach",
};

export const SolutionOthers = memo(({ currentSlug }: SolutionOthersProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const otherSolutions = getAllSolutions().filter((s) => s.slug !== currentSlug);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".other-solution", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [currentSlug]);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 bg-white border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Découvrez aussi
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {otherSolutions.map((s) => {
            const SIcon = s.icon;
            const bgColor = solutionColors[s.slug] || "bg-pastel-cream";
            
            return (
              <Link
                key={s.slug}
                to={`/solutions/${s.slug}`}
                className={`other-solution group flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 ${bgColor} rounded-full hover:shadow-lg hover:shadow-black/5 transition-all duration-300`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/60 flex items-center justify-center">
                  <SIcon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                </div>
                <span className="font-medium text-foreground text-sm sm:text-base">
                  {s.title.replace("Linea Suite pour les ", "").replace("LINEA pour les ", "")}
                </span>
                <ArrowRight className="w-4 h-4 text-foreground/50 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
});

SolutionOthers.displayName = "SolutionOthers";
