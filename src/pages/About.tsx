import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Heart, Zap, Users, Building2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    icon: Target,
    title: "Focalisés sur le métier",
    description: "Nous comprenons les défis spécifiques des agences d'architecture car nous travaillons main dans la main avec elles.",
  },
  {
    icon: Zap,
    title: "Simplicité avant tout",
    description: "Un outil puissant ne doit pas être complexe. Chaque fonctionnalité est pensée pour être intuitive.",
  },
  {
    icon: Heart,
    title: "Passion du design",
    description: "En tant qu'outil pour créatifs, nous accordons une attention particulière à l'esthétique et l'expérience utilisateur.",
  },
  {
    icon: Users,
    title: "Partenaires de croissance",
    description: "Votre succès est notre priorité. Nous évoluons avec vous et adaptons nos outils à vos besoins.",
  },
];

const team = [
  { name: "Marie Laurent", role: "CEO & Co-fondatrice", avatar: "M" },
  { name: "Thomas Dubois", role: "CTO & Co-fondateur", avatar: "T" },
  { name: "Sophie Martin", role: "Head of Product", avatar: "S" },
  { name: "Pierre Leroy", role: "Lead Developer", avatar: "P" },
];

export default function About() {
  const valuesRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".value-card", {
        scrollTrigger: {
          trigger: valuesRef.current,
          start: "top 80%",
        },
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(".team-member", {
        scrollTrigger: {
          trigger: teamRef.current,
          start: "top 80%",
        },
        opacity: 0,
        scale: 0.9,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <>
      <SEOHead
        title="À propos | Linea Suite - Notre mission et notre équipe"
        description="Découvrez l'équipe derrière Linea Suite et notre mission : simplifier la gestion des agences d'architecture avec des outils modernes et intuitifs."
        keywords="à propos, équipe, mission, Linea Suite, architecture, logiciel"
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Construire le futur de la gestion <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                d'agences d'architecture
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Linea Suite est né d'une conviction : les architectes méritent des outils 
              aussi bien conçus que les bâtiments qu'ils créent.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Notre histoire</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Tout a commencé en 2023, lorsque nos fondateurs, issus du monde de 
                    l'architecture et du développement logiciel, ont constaté un problème 
                    récurrent : les agences utilisaient des dizaines d'outils déconnectés 
                    pour gérer leurs projets.
                  </p>
                  <p>
                    Excel pour les budgets, emails pour le suivi client, Word pour les 
                    comptes-rendus... Le temps perdu à naviguer entre ces outils était colossal.
                  </p>
                  <p>
                    Linea Suite est la réponse à ce défi : une plateforme unique, pensée 
                    par et pour les architectes, qui centralise tous les aspects de la 
                    gestion d'agence.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center">
                  <Building2 className="w-32 h-32 text-primary/30" />
                </div>
                <div className="absolute -bottom-6 -right-6 p-6 bg-card border border-border rounded-2xl shadow-lg">
                  <div className="text-4xl font-bold text-foreground">500+</div>
                  <div className="text-muted-foreground">Agences utilisatrices</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section ref={valuesRef} className="py-24 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Nos valeurs</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Les principes qui guident chacune de nos décisions produit.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <div
                    key={value.title}
                    className="value-card p-6 bg-card border border-border rounded-xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="text-primary" size={24} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team */}
        <section ref={teamRef} className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">L'équipe</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des passionnés de technologie et d'architecture, réunis par une vision commune.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {team.map((member) => (
                <div key={member.name} className="team-member text-center">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {member.avatar}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Rejoignez l'aventure
            </h2>
            <p className="text-muted-foreground mb-8">
              Nous recrutons ! Découvrez nos offres et rejoignez une équipe passionnée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg">
                  Nous contacter
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg">
                  Essayer Linea Suite
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
