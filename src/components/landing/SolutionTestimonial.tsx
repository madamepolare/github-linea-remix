import { memo } from "react";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

interface SolutionTestimonialProps {
  testimonial: Testimonial;
  color: string;
}

export const SolutionTestimonial = memo(({ testimonial, color }: SolutionTestimonialProps) => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="w-12 h-12 text-primary/30 mx-auto mb-6" />
          <blockquote className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
            "{testimonial.quote}"
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div
              className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-lg`}
            >
              {testimonial.author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">
                {testimonial.author}
              </div>
              <div className="text-sm text-muted-foreground">
                {testimonial.role}
              </div>
              <div className="text-sm text-primary">
                {testimonial.company}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

SolutionTestimonial.displayName = "SolutionTestimonial";
