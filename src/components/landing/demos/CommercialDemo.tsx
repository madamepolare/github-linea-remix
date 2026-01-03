import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileText, Check, Euro } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const phases = [
  { code: "ESQ", name: "Esquisse", percentage: 5, amount: 0 },
  { code: "APS", name: "Avant-Projet Sommaire", percentage: 10, amount: 0 },
  { code: "APD", name: "Avant-Projet Définitif", percentage: 20, amount: 0 },
  { code: "PRO", name: "Projet", percentage: 25, amount: 0 },
  { code: "DCE", name: "Dossier de Consultation", percentage: 15, amount: 0 },
  { code: "VISA", name: "Visa", percentage: 15, amount: 0 },
  { code: "DET", name: "Direction Travaux", percentage: 10, amount: 0 },
];

export const CommercialDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const constructionBudget = 850000;
  const feePercentage = 8;
  const totalFees = constructionBudget * (feePercentage / 100);

  useEffect(() => {
    if (!demoRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".quote-section", {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 70%",
        },
      });

      gsap.from(".phase-row", {
        opacity: 0,
        x: -20,
        stagger: 0.05,
        delay: 0.3,
        duration: 0.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 70%",
        },
      });

      // Animate total
      gsap.to({}, {
        duration: 1.5,
        delay: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 70%",
          onEnter: () => {
            let start = 0;
            const increment = totalFees / 60;
            const timer = setInterval(() => {
              start += increment;
              if (start >= totalFees) {
                setAnimatedTotal(totalFees);
                clearInterval(timer);
              } else {
                setAnimatedTotal(start);
              }
            }, 25);
          },
        },
      });
    }, demoRef);

    return () => ctx.revert();
  }, [totalFees]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  };

  const phasesWithAmounts = phases.map(phase => ({
    ...phase,
    amount: totalFees * (phase.percentage / 100),
  }));

  return (
    <div ref={demoRef} className="relative bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header - like a quote document */}
      <div className="quote-section bg-muted/30 p-6 border-b border-border/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Proposition n°2024-042</span>
            </div>
            <h3 className="font-semibold text-foreground text-lg">Villa Moderna - Mission complète</h3>
            <p className="text-sm text-muted-foreground">M. et Mme Dupont · Lyon 6ème</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">Budget travaux</div>
            <div className="text-xl font-bold text-foreground">{formatCurrency(constructionBudget)}</div>
            <div className="text-sm text-primary">Taux: {feePercentage}%</div>
          </div>
        </div>
      </div>

      {/* Phases breakdown */}
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-1">Détail des phases</h4>
          <p className="text-xs text-muted-foreground">Honoraires calculés automatiquement</p>
        </div>

        <div className="space-y-2">
          {phasesWithAmounts.map((phase, index) => (
            <div
              key={index}
              className="phase-row flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="w-12 text-xs font-medium text-primary">{phase.code}</div>
              <div className="flex-1 text-sm text-foreground">{phase.name}</div>
              <div className="w-16 text-right text-sm text-muted-foreground">{phase.percentage}%</div>
              <div className="w-24 text-right text-sm font-medium text-foreground">
                {formatCurrency(phase.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="quote-section mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-500" />
            <span className="font-medium text-foreground">Total honoraires HT</span>
          </div>
          <div className="flex items-center gap-1 text-2xl font-bold text-emerald-600">
            <Euro className="w-5 h-5" />
            {formatCurrency(animatedTotal)}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs">
        <span className="text-emerald-600 font-medium">✨ Calcul automatique</span>
      </div>
    </div>
  );
};
