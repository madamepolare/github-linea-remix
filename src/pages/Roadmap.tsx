import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, Sparkles, ArrowRight, Rocket, Target, Lightbulb } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface RoadmapItem {
  title: string;
  description: string;
  status: "done" | "in-progress" | "planned";
  quarter?: string;
}

interface RoadmapSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: RoadmapItem[];
}

const roadmapData: RoadmapSection[] = [
  {
    title: "Livré",
    icon: <Check className="text-green-500" size={24} />,
    color: "green",
    items: [
      { title: "Gestion de projets", description: "Phases, livrables et timeline complète", status: "done" },
      { title: "CRM intégré", description: "Pipeline commercial et gestion des contacts", status: "done" },
      { title: "Devis & Propositions", description: "Génération automatique de documents", status: "done" },
      { title: "Module appels d'offres", description: "Suivi et analyse des AO", status: "done" },
      { title: "Planning chantier", description: "Gantt multi-lots avec interventions", status: "done" },
      { title: "Comptes-rendus de chantier", description: "Génération PDF automatique", status: "done" },
    ],
  },
  {
    title: "En cours",
    icon: <Clock className="text-primary" size={24} />,
    color: "primary",
    items: [
      { title: "IA pour appels d'offres", description: "Analyse automatique des DCE et génération de mémoires techniques", status: "in-progress" },
      { title: "Signatures électroniques", description: "Intégration native pour devis et contrats", status: "in-progress" },
      { title: "Application mobile", description: "iOS et Android pour le suivi terrain", status: "in-progress" },
    ],
  },
  {
    title: "Prévu T2 2026",
    icon: <Target className="text-orange-500" size={24} />,
    color: "orange",
    items: [
      { title: "Intégration comptable", description: "Synchronisation avec les logiciels de comptabilité", status: "planned", quarter: "T2 2026" },
      { title: "API publique", description: "Connectez vos outils existants", status: "planned", quarter: "T2 2026" },
      { title: "Automatisations avancées", description: "Workflows personnalisables", status: "planned", quarter: "T2 2026" },
      { title: "Multi-agences", description: "Gestion centralisée pour groupes", status: "planned", quarter: "T2 2026" },
    ],
  },
  {
    title: "Vision",
    icon: <Lightbulb className="text-purple-500" size={24} />,
    color: "purple",
    items: [
      { title: "IA architecturale", description: "Suggestions de conception et analyse de plans", status: "planned" },
      { title: "Collaboration MOE/MOA", description: "Portail client intégré", status: "planned" },
      { title: "Analytics avancés", description: "Business intelligence pour agences", status: "planned" },
    ],
  },
];

const getStatusBadge = (status: RoadmapItem["status"]) => {
  switch (status) {
    case "done":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Livré</Badge>;
    case "in-progress":
      return <Badge className="bg-primary/10 text-primary border-primary/20">En cours</Badge>;
    case "planned":
      return <Badge variant="outline">Prévu</Badge>;
  }
};

export default function Roadmap() {
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".roadmap-section", {
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
        },
        opacity: 0,
        x: -50,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".roadmap-item", {
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 70%",
        },
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.3,
      });
    }, timelineRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <SEOHead
        title="Roadmap | Linea Suite - Les prochaines fonctionnalités"
        description="Découvrez les fonctionnalités à venir sur Linea Suite. Suivez notre roadmap produit et nos évolutions planifiées."
        keywords="roadmap, fonctionnalités, évolutions, Linea Suite, architecture"
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Rocket size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">Roadmap produit</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ce que nous construisons
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les fonctionnalités livrées, en cours de développement et notre vision 
              pour l'avenir de Linea Suite.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section ref={timelineRef} className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

              <div className="space-y-12">
                {roadmapData.map((section, sectionIndex) => (
                  <div key={section.title} className="roadmap-section relative">
                    {/* Section header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center relative z-10">
                        {section.icon}
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                    </div>

                    {/* Items */}
                    <div className="md:ml-20 grid gap-4">
                      {section.items.map((item, itemIndex) => (
                        <div
                          key={item.title}
                          className="roadmap-item p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                              <p className="text-muted-foreground text-sm">{item.description}</p>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Une idée de fonctionnalité ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Nous construisons Linea Suite avec vous. Partagez vos idées et votez pour les 
              fonctionnalités que vous souhaitez voir arriver.
            </p>
            <Link to="/contact">
              <Button size="lg">
                Nous contacter
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
