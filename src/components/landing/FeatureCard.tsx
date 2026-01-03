import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  animationData?: object;
  icon?: React.ReactNode;
  index: number;
  slug?: string;
}

export const FeatureCard = ({
  title,
  description,
  animationData,
  icon,
  index,
  slug,
}: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const element = slug ? linkRef.current : cardRef.current;
    if (element) {
      gsap.set(element, { opacity: 0, y: 60 });
    }
  }, [slug]);

  const CardContent = (
    <>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Icon container */}
        <div className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop
              className="w-10 h-10"
            />
          ) : (
            <div className="text-primary">{icon}</div>
          )}
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
        
        {slug && (
          <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            En savoir plus
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </>
  );

  const className = "feature-card group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5";

  if (slug) {
    return (
      <Link
        to={`/modules/${slug}`}
        ref={linkRef}
        className={className}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {CardContent}
      </Link>
    );
  }

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {CardContent}
    </div>
  );
};
