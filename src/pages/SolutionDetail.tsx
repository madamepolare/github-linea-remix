import { useParams, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { getSolutionBySlug } from "@/lib/solutionsData";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { SolutionHero } from "@/components/landing/SolutionHero";
import { SolutionBenefits } from "@/components/landing/SolutionBenefits";
import { SolutionChallenges } from "@/components/landing/SolutionChallenges";
import { SolutionFeatures } from "@/components/landing/SolutionFeatures";
import { SolutionTestimonial } from "@/components/landing/SolutionTestimonial";
import { SolutionCTA } from "@/components/landing/SolutionCTA";
import { SolutionOthers } from "@/components/landing/SolutionOthers";

const SolutionDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const solution = slug ? getSolutionBySlug(slug) : undefined;

  if (!solution) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      <SEOHead
        title={`${solution.title} | Linea Suite`}
        description={solution.description}
        canonicalUrl={`https://linea-suite.com/solutions/${solution.slug}`}
      />
      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero - same style as ModuleHero */}
        <SolutionHero solution={solution} />

        {/* Benefits stats */}
        <SolutionBenefits benefits={solution.benefits} color={solution.color} />

        {/* Challenges */}
        <SolutionChallenges challenges={solution.challenges} />

        {/* Features with module links */}
        <SolutionFeatures features={solution.features} />

        {/* Testimonial */}
        <SolutionTestimonial testimonial={solution.testimonial} color={solution.color} />

        {/* Other solutions */}
        <SolutionOthers currentSlug={solution.slug} />

        {/* CTA */}
        <SolutionCTA color={solution.color} />

        <Footer />
      </div>
    </>
  );
};

export default SolutionDetail;
