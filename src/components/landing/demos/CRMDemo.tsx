import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Building2, Euro, GripVertical, User } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Lead {
  id: string;
  name: string;
  company: string;
  value: string;
  avatar: string;
}

const initialLeads: Record<string, Lead[]> = {
  prospection: [
    { id: "1", name: "Marc Lefèvre", company: "Groupe Immobilier", value: "85k€", avatar: "ML" },
  ],
  qualification: [
    { id: "2", name: "Anne Martin", company: "SCI Résidence", value: "120k€", avatar: "AM" },
    { id: "3", name: "Pierre Dubois", company: "Promoteur XYZ", value: "250k€", avatar: "PD" },
  ],
  negociation: [
    { id: "4", name: "Sophie Bernard", company: "Famille Bernard", value: "95k€", avatar: "SB" },
  ],
  gagne: [
    { id: "5", name: "Lucas Petit", company: "Mairie de Lyon", value: "180k€", avatar: "LP" },
  ],
};

const columns = [
  { id: "prospection", label: "Prospection", color: "bg-slate-500" },
  { id: "qualification", label: "Qualification", color: "bg-blue-500" },
  { id: "negociation", label: "Négociation", color: "bg-amber-500" },
  { id: "gagne", label: "Gagné", color: "bg-emerald-500" },
];

export const CRMDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const [leads, setLeads] = useState(initialLeads);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);

  useEffect(() => {
    if (!demoRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".pipeline-column", {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(".lead-card", {
        opacity: 0,
        x: -20,
        stagger: 0.08,
        delay: 0.3,
        duration: 0.4,
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

  // Simulate card movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingCard("2");
      
      setTimeout(() => {
        setLeads(prev => {
          const newLeads = { ...prev };
          const cardIndex = newLeads.qualification.findIndex(l => l.id === "2");
          if (cardIndex !== -1) {
            const [card] = newLeads.qualification.splice(cardIndex, 1);
            newLeads.negociation.unshift(card);
          } else {
            const cardIndex2 = newLeads.negociation.findIndex(l => l.id === "2");
            if (cardIndex2 !== -1) {
              const [card] = newLeads.negociation.splice(cardIndex2, 1);
              newLeads.qualification.push(card);
            }
          }
          return newLeads;
        });
        setAnimatingCard(null);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={demoRef} className="relative bg-card rounded-2xl border border-border/50 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Pipeline commercial</h3>
          <p className="text-sm text-muted-foreground">5 opportunités · 730k€ en cours</p>
        </div>
      </div>

      {/* Pipeline columns */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="pipeline-column">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <span className="text-sm font-medium text-foreground">{column.label}</span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {leads[column.id]?.length || 0}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px] bg-muted/20 rounded-lg p-2">
              {leads[column.id]?.map((lead) => (
                <div
                  key={lead.id}
                  className={`lead-card bg-card border border-border/50 rounded-lg p-3 cursor-grab hover:border-primary/30 transition-all duration-300 ${
                    animatingCard === lead.id ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                          {lead.avatar}
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{lead.company}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 ml-6">
                    <Euro className="w-3 h-3 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600">{lead.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating notification */}
      <div className="absolute top-4 right-4 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs animate-pulse">
        <span className="text-primary font-medium">🔄 Opportunité déplacée</span>
      </div>
    </div>
  );
};
