import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getAllSolutions, SolutionData } from "@/lib/solutionsData";

interface SolutionOthersProps {
  currentSlug: string;
}

export const SolutionOthers = memo(({ currentSlug }: SolutionOthersProps) => {
  const otherSolutions = getAllSolutions().filter((s) => s.slug !== currentSlug);

  return (
    <section className="py-16 bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-foreground">
            Découvrez aussi
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {otherSolutions.map((s) => {
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
  );
});

SolutionOthers.displayName = "SolutionOthers";
