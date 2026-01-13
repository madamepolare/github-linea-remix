import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  badge?: string;
}

export const PricingCard = ({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  ctaText,
  badge,
}: PricingCardProps) => {
  return (
    <div
      className={`pricing-card relative p-8 rounded-2xl border transition-all duration-500 ${
        highlighted
          ? "bg-gradient-to-b from-primary/10 to-card border-primary/50 shadow-xl shadow-primary/10 scale-105"
          : "bg-card border-border/50 hover:border-primary/30 hover:shadow-lg"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg">
            {badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="price-value text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {price}
          </span>
          {period && (
            <span className="text-muted-foreground text-sm">/{period}</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                highlighted ? "bg-primary" : "bg-primary/20"
              }`}
            >
              <Check
                size={12}
                className={highlighted ? "text-primary-foreground" : "text-primary"}
              />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link to="/onboarding" className="block">
        <Button
          className={`w-full font-medium ${
            highlighted
              ? "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
              : ""
          }`}
          variant={highlighted ? "default" : "outline"}
        >
          {ctaText}
        </Button>
      </Link>
    </div>
  );
};
