import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SolutionCTAProps {
  color: string;
}

export const SolutionCTA = memo(({ color }: SolutionCTAProps) => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Prêt à transformer votre pratique ?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Rejoignez les professionnels qui ont déjà optimisé leur gestion avec
          Linea Suite.
        </p>
        <Button
          asChild
          size="lg"
          className={`bg-gradient-to-r ${color} hover:opacity-90`}
        >
          <Link to="/auth">
            Commencer gratuitement
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
});

SolutionCTA.displayName = "SolutionCTA";
