import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Clock, Play } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const phases = [
  { name: "ESQ", label: "Esquisse", status: "completed", start: 0, width: 15, color: "bg-emerald-500" },
  { name: "APS", label: "Avant-Projet Sommaire", status: "completed", start: 15, width: 20, color: "bg-blue-500" },
  { name: "APD", label: "Avant-Projet Définitif", status: "in-progress", start: 35, width: 25, color: "bg-amber-500" },
  { name: "PRO", label: "Projet", status: "pending", start: 60, width: 20, color: "bg-purple-500" },
  { name: "DCE", label: "Dossier Consultation", status: "pending", start: 80, width: 20, color: "bg-rose-500" },
];

const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct"];

export const ProjectsDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!demoRef.current) return;

    const ctx = gsap.context(() => {
      // Animate bars - once only
      gsap.from(".gantt-bar", {
        scaleX: 0,
        transformOrigin: "left",
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });

      // Pulse today indicator - simple CSS animation instead
      gsap.set(".today-indicator", { opacity: 1 });

      // Animate floating cards - once only
      gsap.from(".floating-card", {
        opacity: 0,
        y: 20,
        stagger: 0.2,
        delay: 0.8,
        duration: 0.5,
        ease: "back.out(1.7)",
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
        <div>
          <h3 className="font-semibold text-foreground">Planning phases - Villa Moderna</h3>
          <p className="text-sm text-muted-foreground">Durée totale: 10 mois</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-emerald-500">
            <Check className="w-4 h-4" /> 2 terminées
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <Play className="w-4 h-4" /> 1 en cours
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" /> 2 à venir
          </span>
        </div>
      </div>

      {/* Timeline header */}
      <div className="flex mb-2 text-xs text-muted-foreground">
        {months.map((month, i) => (
          <div key={i} className="flex-1 text-center border-l border-border/30 first:border-l-0">
            {month}
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="relative space-y-3">
        {/* Today indicator */}
        <div 
          className="today-indicator absolute top-0 bottom-0 w-0.5 bg-primary z-10 animate-pulse"
          style={{ left: "45%" }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary rounded text-[10px] text-white font-medium whitespace-nowrap">
            Aujourd'hui
          </div>
        </div>

        {phases.map((phase, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-12 text-xs font-medium text-muted-foreground">{phase.name}</div>
            <div className="flex-1 relative h-10 bg-muted/30 rounded-lg">
              <div
                className={`gantt-bar absolute top-1 bottom-1 ${phase.color} rounded-md flex items-center px-3`}
                style={{ left: `${phase.start}%`, width: `${phase.width}%` }}
              >
                <span className="text-xs text-white font-medium truncate">{phase.label}</span>
                {phase.status === "completed" && (
                  <Check className="w-3 h-3 text-white ml-auto flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating notification cards */}
      <div className="floating-card absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs">
        <span className="text-emerald-600 font-medium">✓ Phase APS validée</span>
      </div>
      <div className="floating-card absolute bottom-4 right-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs">
        <span className="text-blue-600 font-medium">📎 Nouveau livrable ajouté</span>
      </div>
    </div>
  );
};
