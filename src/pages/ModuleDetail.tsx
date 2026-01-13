import { useParams, Navigate, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getModuleBySlug, getAllModules } from "@/lib/modulesData";
import { NewLandingNav } from "@/components/landing/NewLandingNav";
import { NewFooter } from "@/components/landing/NewFooter";
import { SEOHead } from "@/components/seo/SEOHead";
import { NewModuleHero } from "@/components/landing/NewModuleHero";
import { ModuleFeatures } from "@/components/landing/ModuleFeatures";
import { ModuleTestimonial } from "@/components/landing/ModuleTestimonial";
import { ModuleCTA } from "@/components/landing/ModuleCTA";
import { ModuleLongDescription } from "@/components/landing/ModuleLongDescription";
import { ModuleUseCases } from "@/components/landing/ModuleUseCases";
import { ModuleBenefits } from "@/components/landing/ModuleBenefits";
import { ModuleIntegrations } from "@/components/landing/ModuleIntegrations";
import { ModuleFAQ } from "@/components/landing/ModuleFAQ";
import { ProjectsDemo } from "@/components/landing/demos/ProjectsDemo";
import { CRMDemo } from "@/components/landing/demos/CRMDemo";
import { CommercialDemo } from "@/components/landing/demos/CommercialDemo";
import { TendersDemo } from "@/components/landing/demos/TendersDemo";
import { PlanningDemo } from "@/components/landing/demos/PlanningDemo";
import { CollaborationDemo } from "@/components/landing/demos/CollaborationDemo";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const DemoComponents: Record<string, React.ComponentType> = {
  projets: ProjectsDemo,
  crm: CRMDemo,
  commercial: CommercialDemo,
  "appels-offres": TendersDemo,
  planning: PlanningDemo,
  collaboration: CollaborationDemo,
};

const moduleColors: Record<string, string> = {
  projets: "bg-pastel-blue",
  crm: "bg-pastel-pink",
  commercial: "bg-pastel-mint",
  planning: "bg-pastel-lavender",
  "appels-offres": "bg-pastel-peach",
  collaboration: "bg-pastel-coral",
};

const ModuleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const module = slug ? getModuleBySlug(slug) : undefined;
  const othersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!othersRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".other-module", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: othersRef.current,
          start: "top 85%",
        },
      });
    }, othersRef);

    return () => ctx.revert();
  }, [slug]);

  if (!module) {
    return <Navigate to="/welcome" replace />;
  }

  const DemoComponent = DemoComponents[module.slug];
  const allModules = getAllModules().filter((m) => m.slug !== module.slug);

  return (
    <>
      <SEOHead
        title={`${module.title} | Linea Suite`}
        description={module.description}
        keywords={`${module.title}, architecture, gestion projet, logiciel architecte, ${module.slug}`}
      />
      
      <div className="min-h-screen bg-pastel-cream">
        <NewLandingNav />

        {/* Hero */}
        <NewModuleHero module={module} />

        {/* Long Description */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto prose prose-lg"
            >
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {module.longDescription}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-16 sm:py-20 bg-pastel-cream">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
                Découvrez l'interface en action
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Un aperçu de ce que vous pourrez accomplir avec ce module
              </p>
            </motion.div>
            <div className="max-w-5xl mx-auto">
              {DemoComponent && <DemoComponent />}
            </div>
          </div>
        </section>

        {/* Features */}
        <ModuleFeatures features={module.features} color={module.color} />

        {/* Use Cases */}
        <ModuleUseCases useCases={module.useCases} color={module.color} />

        {/* Benefits */}
        <ModuleBenefits benefits={module.benefits} color={module.color} />

        {/* Integrations */}
        <ModuleIntegrations integrations={module.integrations} currentSlug={module.slug} />

        {/* Testimonial */}
        <ModuleTestimonial testimonial={module.testimonial} color={module.color} />

        {/* FAQ */}
        <ModuleFAQ faq={module.faq} />

        {/* Other modules */}
        <section ref={othersRef} className="py-16 sm:py-20 border-t border-border/30 bg-white">
          <div className="container mx-auto px-4">
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-8 sm:mb-12 text-center">
              Découvrez aussi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {allModules.map((m) => {
                const Icon = m.icon;
                const bgColor = moduleColors[m.slug] || "bg-pastel-cream";
                
                return (
                  <Link
                    key={m.slug}
                    to={`/modules/${m.slug}`}
                    className={`other-module group p-4 sm:p-6 rounded-2xl ${bgColor} hover:shadow-lg hover:shadow-black/5 transition-all duration-300 text-center hover:-translate-y-1`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-xl bg-white/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {m.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <ModuleCTA title={module.title} color={module.color} />

        {/* Footer */}
        <NewFooter />
      </div>
    </>
  );
};

export default ModuleDetail;
