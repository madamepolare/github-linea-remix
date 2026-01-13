import { useEffect, useRef, forwardRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Linea Suite a transformé notre façon de gérer les projets. La vue d'ensemble sur les phases et les livrables nous fait gagner un temps précieux.",
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

export const TestimonialsCarousel = forwardRef<HTMLDivElement>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const track = trackRef.current;
    const totalWidth = track.scrollWidth / 2;

    const tween = gsap.to(track, {
      x: -totalWidth,
      duration: 50,
      ease: "none",
      repeat: -1,
    });

    // Pause on hover
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseenter", () => tween.pause());
      container.addEventListener("mouseleave", () => tween.resume());
    }

    return () => {
      tween.kill();
      if (container) {
        container.removeEventListener("mouseenter", () => tween.pause());
        container.removeEventListener("mouseleave", () => tween.resume());
      }
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
            className="w-[320px] sm:w-[380px] lg:w-[420px] flex-shrink-0 p-6 sm:p-8 rounded-3xl bg-white border border-border/30 hover:shadow-xl hover:shadow-black/5 transition-all duration-500"
          >
            <Quote className="w-8 h-8 text-pastel-blue mb-4" />
            <p className="text-foreground mb-6 leading-relaxed text-sm sm:text-base">
              "{testimonial.quote}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-foreground to-foreground/60 flex items-center justify-center">
                <span className="text-background font-semibold text-lg">
                  {testimonial.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm sm:text-base">{testimonial.author}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {testimonial.role} · {testimonial.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TestimonialsCarousel.displayName = "TestimonialsCarousel";
