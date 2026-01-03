import { useParams, Navigate } from "react-router-dom";
import { getModuleBySlug, getAllModules } from "@/lib/modulesData";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { ModuleHero } from "@/components/landing/ModuleHero";
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
import { Link } from "react-router-dom";

const DemoComponents: Record<string, React.ComponentType> = {
  projets: ProjectsDemo,
  crm: CRMDemo,
  commercial: CommercialDemo,
  "appels-offres": TendersDemo,
  planning: PlanningDemo,
  collaboration: CollaborationDemo,
};

const ModuleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const module = slug ? getModuleBySlug(slug) : undefined;

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
      
      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <ModuleHero module={module} />

        {/* Long Description */}
        <ModuleLongDescription longDescription={module.longDescription} />

        {/* Demo Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Découvrez l'interface en action
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Un aperçu de ce que vous pourrez accomplir avec ce module
              </p>
            </div>
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
        <section className="py-16 border-t border-border/50">
          <div className="container mx-auto px-4">
            <h3 className="text-xl font-semibold text-foreground mb-8 text-center">
              Découvrez aussi
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {allModules.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.slug}
                    to={`/modules/${m.slug}`}
                    className="group p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all text-center bg-card hover:shadow-lg"
                  >
                    <div className={`w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
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
        <Footer />
      </div>
    </>
  );
};

export default ModuleDetail;
