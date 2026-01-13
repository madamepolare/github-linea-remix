import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HardHat, Users } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const lots = [
  { name: "Gros œuvre", company: "Bâti+", color: "bg-slate-500", interventions: [{ start: 0, width: 35 }] },
  { name: "Charpente", company: "Bois Expert", color: "bg-amber-500", interventions: [{ start: 30, width: 20 }] },
  { name: "Couverture", company: "Toit Pro", color: "bg-rose-500", interventions: [{ start: 45, width: 15 }] },
  { name: "Menuiseries ext.", company: "Alu Design", color: "bg-blue-500", interventions: [{ start: 55, width: 20 }] },
  { name: "Électricité", company: "Elec+", color: "bg-yellow-500", interventions: [{ start: 40, width: 40 }] },
  { name: "Plomberie", company: "Aqua Services", color: "bg-cyan-500", interventions: [{ start: 45, width: 35 }] },
  { name: "Plâtrerie", company: "Placo Expert", color: "bg-purple-500", interventions: [{ start: 60, width: 25 }] },
  { name: "Peinture", company: "Color Pro", color: "bg-pink-500", interventions: [{ start: 80, width: 20 }] },
];

const weeks = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12"];

export const PlanningDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!demoRef.current) return;

    const ctx = gsap.context(() => {
      // Animate rows - once only
      gsap.from(".lot-row", {
        opacity: 0,
        x: -20,
        stagger: 0.08,
        duration: 0.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });

      // Animate intervention bars - once only
      gsap.from(".intervention-bar", {
        scaleX: 0,
        transformOrigin: "left",
        stagger: 0.06,
        delay: 0.3,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, demoRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={demoRef} className="relative bg-card rounded-2xl border border-border/50 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Planning chantier - Résidence Les Iris</h3>
            <p className="text-sm text-muted-foreground">8 lots · 12 semaines</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>8 entreprises</span>
        </div>
      </div>

      {/* Week headers */}
      <div className="flex mb-2 ml-[200px]">
        {weeks.map((week, i) => (
          <div key={i} className="flex-1 text-center text-xs text-muted-foreground border-l border-border/30 first:border-l-0">
            {week}
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="relative">
        {/* Today indicator */}
        <div
          className="today-line absolute top-0 bottom-0 w-0.5 bg-primary z-10 animate-pulse"
          style={{ left: "calc(200px + 50%)" }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary rounded text-[10px] text-white font-medium whitespace-nowrap">
            Aujourd'hui
          </div>
        </div>

        {/* Lot rows */}
        <div className="space-y-2">
          {lots.map((lot, index) => (
            <div key={index} className="lot-row flex items-center">
              {/* Lot info */}
              <div className="w-[200px] flex-shrink-0 pr-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${lot.color}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{lot.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{lot.company}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 relative h-8 bg-muted/20 rounded">
                {lot.interventions.map((intervention, i) => (
                  <div
                    key={i}
                    className={`intervention-bar absolute top-1 bottom-1 ${lot.color} rounded flex items-center px-2`}
                    style={{ left: `${intervention.start}%`, width: `${intervention.width}%` }}
                  >
                    <span className="text-[10px] text-white font-medium truncate opacity-90">
                      {lot.company}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating notification */}
      <div className="absolute bottom-4 right-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs animate-bounce">
        <span className="text-blue-600 font-medium">📧 Convocations envoyées</span>
      </div>
    </div>
  );
};
