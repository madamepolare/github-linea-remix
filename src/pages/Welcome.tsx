import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { PricingCard } from "@/components/landing/PricingCard";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import {
  FolderKanban,
  Users,
  FileText,
  Trophy,
  CalendarDays,
  UsersRound,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Lottie animation data (simple geometric shapes)
const heroAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 400,
  h: 400,
  nm: "Geometric",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 30 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 90, s: [360] }] },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [120, 120, 100] }, { t: 45, s: [120, 120, 100], e: [100, 100, 100] }, { t: 90, s: [100, 100, 100] }] },
      },
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [150, 150] },
          p: { a: 0, k: [0, 0] },
        },
        {
          ty: "st",
          c: { a: 0, k: [0.4, 0.4, 0.9, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 2 },
        },
      ],
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Square",
      sr: 1,
      ks: {
        o: { a: 0, k: 20 },
        r: { a: 1, k: [{ t: 0, s: [45], e: [405] }, { t: 90, s: [405] }] },
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "rc",
          d: 1,
          s: { a: 0, k: [200, 200] },
          p: { a: 0, k: [0, 0] },
          r: { a: 0, k: 0 },
        },
        {
          ty: "st",
          c: { a: 0, k: [0.6, 0.3, 0.9, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 2 },
        },
      ],
    },
  ],
};

const features = [
  {
    title: "Gestion de projets",
    description:
      "Suivez vos projets de A à Z avec une vue complète sur les phases, livrables et délais.",
    icon: <FolderKanban size={28} />,
    slug: "projets",
  },
  {
    title: "CRM intégré",
    description:
      "Gérez vos clients, contacts et opportunités commerciales en un seul endroit.",
    icon: <Users size={28} />,
    slug: "crm",
  },
  {
    title: "Devis & Facturation",
    description:
      "Créez des propositions commerciales professionnelles et suivez vos paiements.",
    icon: <FileText size={28} />,
    slug: "commercial",
  },
  {
    title: "Appels d'offres",
    description:
      "Centralisez vos réponses aux appels d'offres avec l'aide de l'intelligence artificielle.",
    icon: <Trophy size={28} />,
    slug: "appels-offres",
  },
  {
    title: "Planning chantier",
    description:
      "Planifiez les interventions des entreprises et générez des comptes-rendus automatiques.",
    icon: <CalendarDays size={28} />,
    slug: "planning",
  },
  {
    title: "Collaboration",
    description:
      "Travaillez en équipe avec des espaces de travail partagés et des notifications en temps réel.",
    icon: <UsersRound size={28} />,
    slug: "collaboration",
  },
];

const pricingPlans = {
  monthly: [
    {
      name: "Starter",
      price: "Gratuit",
      period: "",
      description: "Pour découvrir Linea Suite",
      features: [
        "1 utilisateur",
        "3 projets actifs",
        "CRM basique",
        "Modèles de documents",
        "Support communauté",
      ],
      highlighted: false,
      ctaText: "Commencer gratuitement",
    },
    {
      name: "Pro",
      price: "49€",
      period: "mois",
      description: "Pour les agences en croissance",
      features: [
        "Utilisateurs illimités",
        "Projets illimités",
        "Tous les modules",
        "IA intégrée",
        "Support prioritaire",
        "Intégrations avancées",
      ],
      highlighted: true,
      ctaText: "Essayer 14 jours gratuit",
      badge: "Le plus populaire",
    },
    {
      name: "Enterprise",
      price: "Sur devis",
      period: "",
      description: "Pour les grandes structures",
      features: [
        "Tout de Pro",
        "SSO & SAML",
        "API dédiée",
        "Onboarding personnalisé",
        "Account manager",
        "SLA garanti",
      ],
      highlighted: false,
      ctaText: "Contacter les ventes",
    },
  ],
  yearly: [
    {
      name: "Starter",
      price: "Gratuit",
      period: "",
      description: "Pour découvrir Linea Suite",
      features: [
        "1 utilisateur",
        "3 projets actifs",
        "CRM basique",
        "Modèles de documents",
        "Support communauté",
      ],
      highlighted: false,
      ctaText: "Commencer gratuitement",
    },
    {
      name: "Pro",
      price: "39€",
      period: "mois",
      description: "Pour les agences en croissance",
      features: [
        "Utilisateurs illimités",
        "Projets illimités",
        "Tous les modules",
        "IA intégrée",
        "Support prioritaire",
        "Intégrations avancées",
      ],
      highlighted: true,
      ctaText: "Essayer 14 jours gratuit",
      badge: "Économisez 20%",
    },
    {
      name: "Enterprise",
      price: "Sur devis",
      period: "",
      description: "Pour les grandes structures",
      features: [
        "Tout de Pro",
        "SSO & SAML",
        "API dédiée",
        "Onboarding personnalisé",
        "Account manager",
        "SLA garanti",
      ],
      highlighted: false,
      ctaText: "Contacter les ventes",
    },
  ],
};

const Welcome = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero animations
    const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });
    
    heroTl
      .from(".hero-badge", { opacity: 0, y: 30, duration: 0.8 })
      .from(".hero-title", { opacity: 0, y: 50, duration: 1 }, "-=0.4")
      .from(".hero-subtitle", { opacity: 0, y: 30, duration: 0.8 }, "-=0.6")
      .from(".hero-cta", { opacity: 0, y: 20, scale: 0.9, stagger: 0.1, duration: 0.6 }, "-=0.4")
      .from(".hero-stats", { opacity: 0, y: 30, duration: 0.8 }, "-=0.3")
      .from(".hero-lottie", { opacity: 0, scale: 0.8, duration: 1 }, "-=1");

    // Features scroll animation
    ScrollTrigger.batch(".feature-card", {
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: "power3.out",
        }),
      start: "top 85%",
    });

    // Section headers animation
    gsap.utils.toArray<HTMLElement>(".section-header").forEach((header) => {
      gsap.from(header, {
        scrollTrigger: {
          trigger: header,
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
      });
    });

    // Pricing cards animation
    ScrollTrigger.batch(".pricing-card", {
      onEnter: (batch) =>
        gsap.from(batch, {
          opacity: 0,
          y: 50,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
        }),
      start: "top 85%",
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Animate pricing on toggle
  useEffect(() => {
    gsap.from(".price-value", {
      scale: 1.1,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [billingPeriod]);

  return (
    <>
      <SEOHead
        title="Linea Suite | Logiciel de gestion pour architectes"
        description="Linea Suite - La plateforme tout-en-un pour gérer vos projets d'architecture : CRM, devis, appels d'offres, planning chantier."
        keywords="architecture, gestion projet, CRM architecte, devis architecture, logiciel architecte"
      />
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-center lg:text-left">
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">
                  Nouveau : IA intégrée pour les appels d'offres
                </span>
              </div>

              <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                L'outil tout-en-un pour{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  architectes
                </span>
              </h1>

              <p className="hero-subtitle text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                Gérez vos projets, clients, devis et appels d'offres dans une
                plateforme unique conçue pour les agences d'architecture.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link to="/auth" className="hero-cta">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-lg px-8 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
                  >
                    Commencer gratuitement
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="hero-cta w-full sm:w-auto text-lg px-8"
                >
                  Voir la démo
                </Button>
              </div>

              {/* Stats */}
              <div className="hero-stats grid grid-cols-3 gap-8 max-w-lg mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-foreground">
                    <AnimatedCounter end={500} suffix="+" />
                  </div>
                  <div className="text-sm text-muted-foreground">Agences</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-foreground">
                    <AnimatedCounter end={15000} suffix="+" />
                  </div>
                  <div className="text-sm text-muted-foreground">Projets</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-foreground">
                    <AnimatedCounter end={98} suffix="%" />
                  </div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Right content - Lottie animation */}
            <div className="hero-lottie hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                <Lottie
                  animationData={heroAnimationData}
                  loop
                  className="w-full"
                />
                {/* Floating cards */}
                <div className="absolute top-10 right-0 p-4 rounded-xl bg-card border border-border/50 shadow-xl animate-[float_3s_ease-in-out_infinite]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="text-green-500" size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Phase validée</div>
                      <div className="text-xs text-muted-foreground">DCE terminé</div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-20 left-0 p-4 rounded-xl bg-card border border-border/50 shadow-xl animate-[float_3s_ease-in-out_infinite_0.5s]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Building2 className="text-primary" size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Nouveau projet</div>
                      <div className="text-xs text-muted-foreground">Villa Méditerranée</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="section-header text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils pour gérer votre agence d'architecture
              de manière efficace et professionnelle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
                slug={feature.slug}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="section-header text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Des tarifs simples et transparents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choisissez le plan qui correspond à vos besoins. Changez ou annulez
              à tout moment.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-muted border border-border">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingPeriod === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuel
                <span className="ml-2 text-xs text-primary">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start max-w-5xl mx-auto">
            {pricingPlans[billingPeriod].map((plan) => (
              <PricingCard key={plan.name} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-12">
          <div className="section-header text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez ce que nos clients disent de Linea Suite.
            </p>
          </div>
        </div>
        <TestimonialsCarousel />
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="section-header">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Prêt à transformer votre agence ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Rejoignez plus de 500 agences d'architecture qui utilisent
              Linea Suite pour gérer leurs projets.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="text-lg px-10 py-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
              >
                Démarrer maintenant — C'est gratuit
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
    </>
  );
};

export default Welcome;
