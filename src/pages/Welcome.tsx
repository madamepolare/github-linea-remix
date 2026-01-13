import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NewLandingNav } from "@/components/landing/NewLandingNav";
import { NewFooter } from "@/components/landing/NewFooter";
import { SEOHead } from "@/components/seo/SEOHead";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoFeatureGrid } from "@/components/landing/BentoFeatureGrid";
import { NewPricingCard } from "@/components/landing/NewPricingCard";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FloatingShapes } from "@/components/landing/illustrations/FloatingShapes";
import { ArrowRight } from "lucide-react";

const pricingPlans = {
  monthly: [
    {
      name: "Starter",
      price: "Gratuit",
      period: "",
      description: "Pour découvrir LINEA",
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
      description: "Pour découvrir LINEA",
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

  return (
    <>
      <SEOHead
        title="LINEA | Logiciel de gestion pour créatifs"
        description="LINEA - La plateforme tout-en-un pour architectes, architectes d'intérieur, scénographes et agences de communication."
        keywords="architecture, gestion projet, CRM, devis, logiciel architecte, scénographie, agence communication"
      />
      <div className="min-h-screen bg-pastel-cream overflow-x-hidden">
        <NewLandingNav />

        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section id="features" className="py-24 lg:py-32 px-4 bg-white relative">
          <FloatingShapes variant="section" />
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Tout ce dont vous avez besoin
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Une suite complète d'outils pour gérer votre activité créative
                de manière efficace et professionnelle.
              </p>
            </motion.div>

            <BentoFeatureGrid />
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 lg:py-32 px-4 bg-pastel-cream">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Des tarifs simples
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Choisissez le plan qui correspond à vos besoins. Changez ou annulez
                à tout moment.
              </p>

              {/* Billing toggle */}
              <div className="inline-flex items-center p-1.5 rounded-full bg-white border border-border/50">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    billingPeriod === "monthly"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    billingPeriod === "yearly"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Annuel
                  <span className="ml-2 text-xs text-emerald-600 font-semibold">-20%</span>
                </button>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
              {pricingPlans[billingPeriod].map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <NewPricingCard {...plan} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 lg:py-32 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Ils nous font confiance
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez ce que nos clients disent de LINEA.
              </p>
            </motion.div>
          </div>
          <TestimonialsCarousel />
        </section>

        {/* Final CTA Section */}
        <section className="py-24 lg:py-32 px-4 bg-pastel-cream relative overflow-hidden">
          <FloatingShapes variant="section" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Prêt à transformer votre activité ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Rejoignez plus de 500 agences créatives qui utilisent
                LINEA pour gérer leurs projets.
              </p>
              <Link to="/auth">
                <Button
                  size="lg"
                  className="text-base px-10 h-14 bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium shadow-lg shadow-black/10"
                >
                  Démarrer maintenant — C'est gratuit
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <NewFooter />
      </div>
    </>
  );
};

export default Welcome;
