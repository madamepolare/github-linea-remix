import * as React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface NewPricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
  badge?: string;
}

export const NewPricingCard = React.forwardRef<HTMLDivElement, NewPricingCardProps>(
  ({ name, price, period, description, features, highlighted = false, ctaText, badge }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className={`relative p-8 rounded-3xl transition-all duration-300 ${
          highlighted
            ? "bg-foreground text-background ring-4 ring-foreground shadow-2xl shadow-black/20"
            : "bg-white border-2 border-border/50 hover:border-border"
        }`}
      >
        {/* Badge */}
        {badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className={`px-4 py-1.5 text-xs font-semibold rounded-full ${
              highlighted ? "bg-white text-foreground" : "bg-foreground text-background"
            }`}>
              {badge}
            </span>
          </div>
        )}

        {/* Plan name */}
        <h3 className={`text-lg font-semibold mb-2 ${highlighted ? "text-background" : "text-foreground"}`}>
          {name}
        </h3>
        
        {/* Description */}
        <p className={`text-sm mb-6 ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
          {description}
        </p>

        {/* Price */}
        <div className="mb-6">
          <span className={`text-4xl font-bold tracking-tight ${highlighted ? "text-background" : "text-foreground"}`}>
            {price}
          </span>
          {period && (
            <span className={`text-sm ml-1 ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
              /{period}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link to="/onboarding" className="block mb-8">
          <Button
            className={`w-full h-12 rounded-full font-medium ${
              highlighted
                ? "bg-background text-foreground hover:bg-background/90"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {ctaText}
          </Button>
        </Link>

        {/* Features */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                highlighted ? "bg-background/20" : "bg-foreground/10"
              }`}>
                <Check size={12} className={highlighted ? "text-background" : "text-foreground"} />
              </div>
              <span className={`text-sm ${highlighted ? "text-background/90" : "text-muted-foreground"}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    );
  }
);

NewPricingCard.displayName = "NewPricingCard";
