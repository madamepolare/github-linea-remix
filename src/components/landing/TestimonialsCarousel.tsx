import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "ARCHIMIND a transformé notre façon de gérer les projets. La vue d'ensemble sur les phases et les livrables nous fait gagner un temps précieux.",
    author: "Marie Dupont",
    role: "Architecte associée",
    company: "Studio MD Architecture",
  },
  {
    quote:
      "Le module de suivi de chantier est exceptionnel. Fini les comptes-rendus perdus et les informations dispersées.",
    author: "Thomas Bernard",
    role: "Chef de projet",
    company: "Atelier B+",
  },
  {
    quote:
      "La gestion des appels d'offres n'a jamais été aussi fluide. L'IA nous aide à préparer des réponses de qualité en un temps record.",
    author: "Sophie Martin",
    role: "Directrice",
    company: "Archi Concept",
  },
  {
    quote:
      "Un outil complet qui s'adapte parfaitement à notre workflow. Le CRM intégré nous permet de suivre nos clients efficacement.",
    author: "Pierre Leroy",
    role: "Fondateur",
    company: "PL Architectes",
  },
];

export const TestimonialsCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const track = trackRef.current;
    const totalWidth = track.scrollWidth / 2;

    gsap.to(track, {
      x: -totalWidth,
      duration: 40,
      ease: "none",
      repeat: -1,
    });

    return () => {
      gsap.killTweensOf(track);
    };
  }, []);

  // Double the testimonials for infinite scroll effect
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <div ref={containerRef} className="overflow-hidden py-8">
      <div ref={trackRef} className="flex gap-6" style={{ width: "fit-content" }}>
        {duplicatedTestimonials.map((testimonial, index) => (
          <div
            key={index}
            className="w-[400px] flex-shrink-0 p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
          >
            <Quote className="w-10 h-10 text-primary/30 mb-4" />
            <p className="text-foreground mb-6 leading-relaxed">
              "{testimonial.quote}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">
                  {testimonial.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role} · {testimonial.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
