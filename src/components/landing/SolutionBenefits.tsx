import { memo } from "react";

interface Benefit {
  value: string;
  label: string;
}

interface SolutionBenefitsProps {
  benefits: Benefit[];
  color: string;
}

export const SolutionBenefits = memo(({ benefits, color }: SolutionBenefitsProps) => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-4 md:p-6 text-center border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div
                className={`text-2xl md:text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}
              >
                {benefit.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {benefit.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

SolutionBenefits.displayName = "SolutionBenefits";
