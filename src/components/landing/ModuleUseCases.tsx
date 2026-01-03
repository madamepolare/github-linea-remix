import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Layers, FileText, Users, Archive, Star, BarChart, Heart, Calculator, ToggleRight, CreditCard, FileCheck, CheckCircle, Database, Bell, TrendingUp, AlertTriangle, Camera, History, Globe, UserPlus, Activity, CheckSquare } from "lucide-react";
import type { ModuleUseCase } from "@/lib/modulesData";

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  "file-text": FileText,
  users: Users,
  archive: Archive,
  star: Star,
  "bar-chart": BarChart,
  heart: Heart,
  calculator: Calculator,
  "toggle-right": ToggleRight,
  "credit-card": CreditCard,
  "file-check": FileCheck,
  "check-circle": CheckCircle,
  database: Database,
  bell: Bell,
  "trending-up": TrendingUp,
  "alert-triangle": AlertTriangle,
  camera: Camera,
  history: History,
  globe: Globe,
  "user-plus": UserPlus,
  activity: Activity,
  "check-square": CheckSquare,
};

interface ModuleUseCasesProps {
  useCases: ModuleUseCase[];
  color: string;
}

export const ModuleUseCases = ({ useCases, color }: ModuleUseCasesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      gsap.set(".use-case-card", { opacity: 1, y: 0 });
      
      gsap.fromTo(".use-case-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Cas d'usage concrets
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment nos clients utilisent ce module au quotidien
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {useCases.map((useCase) => {
            const IconComponent = iconMap[useCase.icon] || Layers;
            return (
              <div
                key={useCase.title}
                className="use-case-card p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
