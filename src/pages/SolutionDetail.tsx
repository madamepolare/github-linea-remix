import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle, Quote, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSolutionBySlug, getAllSolutions } from "@/lib/solutionsData";
import { getAllModules } from "@/lib/modulesData";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

gsap.registerPlugin(ScrollTrigger);

const SolutionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const solution = slug ? getSolutionBySlug(slug) : undefined;
  const heroRef = useRef<HTMLDivElement>(null);
  const challengesRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const allModules = getAllModules();

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set([".solution-badge", ".solution-title", ".solution-description", ".solution-cta", ".solution-icon"], {
        opacity: 1, y: 0, scale: 1,
      });

      gsap.fromTo(".solution-badge", 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(".solution-title", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(".solution-description", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power3.out" }
      );

      gsap.fromTo(".solution-cta", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(".solution-icon", 
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.3, ease: "back.out(1.7)" }
      );
    }, heroRef);

    return () => ctx.revert();
  }, [slug]);

  useEffect(() => {
    if (!challengesRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(".challenge-card", { opacity: 1, x: 0 });
      
      gsap.fromTo(".challenge-card",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: challengesRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, challengesRef);

    return () => ctx.revert();
  }, [slug]);

  useEffect(() => {
    if (!featuresRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(".feature-card", { opacity: 1, y: 0 });
      
      gsap.fromTo(".feature-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, featuresRef);

    return () => ctx.revert();
  }, [slug]);

  if (!solution) {
    return <Navigate to="/welcome" replace />;
  }

  const Icon = solution.icon;

  const getModuleSlug = (moduleName: string): string | undefined => {
    const moduleMap: Record<string, string> = {
      CRM: "crm",
      Projets: "projets",
      Commercial: "commercial",
      "Appels d'offres": "appels-offres",
      Planning: "planning",
      Collaboration: "collaboration",
    };
    return moduleMap[moduleName];
  };

  const getModuleData = (moduleName: string) => {
    const moduleSlug = getModuleSlug(moduleName);
    return allModules.find((m) => m.slug === moduleSlug);
  };

  return (
    <>
      <SEOHead
        title={`${solution.title} | Linea Suite`}
        description={solution.description}
        canonicalUrl={`https://linea-suite.com/solutions/${solution.slug}`}
      />
      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <section
          ref={heroRef}
          className={`relative pt-32 pb-20 bg-gradient-to-br ${solution.color} overflow-hidden`}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="container mx-auto px-4 relative z-10">
            <Link
              to="/welcome"
              className="solution-badge inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>

            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="solution-icon inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h1 className="solution-title text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {solution.title}
                </h1>
                <p className="solution-description text-xl text-white/90 max-w-2xl mb-8">
                  {solution.description}
                </p>
                <div className="solution-cta flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-foreground hover:bg-white/90"
                  >
                    <Link to="/auth">
                      Démarrer gratuitement
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex-1 hidden lg:flex justify-center">
                <div className="grid grid-cols-3 gap-4">
                  {solution.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20"
                    >
                      <div className="text-3xl font-bold text-white mb-1">
                        {benefit.value}
                      </div>
                      <div className="text-sm text-white/80">{benefit.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits mobile */}
        <section className="py-8 bg-muted/30 lg:hidden">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-4">
              {solution.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-4 text-center border border-border/50"
                >
                  <div
                    className={`text-2xl font-bold bg-gradient-to-r ${solution.color} bg-clip-text text-transparent mb-1`}
                  >
                    {benefit.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {benefit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Challenges */}
        <section ref={challengesRef} className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Vos défis quotidiens
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Nous comprenons les problématiques spécifiques de votre métier
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {solution.challenges.map((challenge, index) => (
                <div
                  key={index}
                  className="challenge-card p-6 rounded-xl bg-card border border-border/50 hover:border-destructive/30 transition-colors"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {challenge.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section ref={featuresRef} className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Nos solutions pour vous
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des modules pensés pour répondre à chacun de vos besoins
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {solution.features.map((feature, index) => {
                const moduleData = getModuleData(feature.module);
                const moduleSlug = getModuleSlug(feature.module);
                const ModuleIcon = moduleData?.icon;

                return (
                  <Link
                    key={index}
                    to={moduleSlug ? `/modules/${moduleSlug}` : "#"}
                    className="feature-card group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
                  >
                    {ModuleIcon && (
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${moduleData?.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <ModuleIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {feature.module}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="flex items-center gap-1 text-primary text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      En savoir plus
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="w-12 h-12 text-primary/30 mx-auto mb-6" />
              <blockquote className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
                "{solution.testimonial.quote}"
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${solution.color} flex items-center justify-center text-white font-bold text-lg`}
                >
                  {solution.testimonial.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">
                    {solution.testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {solution.testimonial.role}
                  </div>
                  <div className="text-sm text-primary">
                    {solution.testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other solutions */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Découvrez aussi
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {getAllSolutions()
                .filter((s) => s.slug !== solution.slug)
                .map((s) => {
                  const SIcon = s.icon;
                  return (
                    <Link
                      key={s.slug}
                      to={`/solutions/${s.slug}`}
                      className="group flex items-center gap-3 px-6 py-4 bg-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <SIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {s.title.replace("Linea Suite pour les ", "")}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Prêt à transformer votre pratique ?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Rejoignez les professionnels qui ont déjà optimisé leur gestion avec
              Linea Suite.
            </p>
            <Button
              asChild
              size="lg"
              className={`bg-gradient-to-r ${solution.color} hover:opacity-90`}
            >
              <Link to="/auth">
                Commencer gratuitement
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default SolutionDetail;
