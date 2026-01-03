import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

interface ModuleCTAProps {
  title: string;
  color: string;
}

export const ModuleCTA = ({ title, color }: ModuleCTAProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".cta-content", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20">
      <div className="container mx-auto px-4">
        <div className={`cta-content relative overflow-hidden rounded-3xl bg-gradient-to-br ${color} p-12 md:p-16`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à transformer votre façon de gérer vos {title.toLowerCase()} ?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Rejoignez des centaines d'agences qui ont déjà adopté Linea Suite pour simplifier leur quotidien.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="px-8 bg-white text-foreground hover:bg-white/90"
                asChild
              >
                <Link to="/auth">
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/welcome#pricing">Voir les tarifs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
