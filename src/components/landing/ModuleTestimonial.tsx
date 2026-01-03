import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface ModuleTestimonialProps {
  testimonial: {
    quote: string;
    author: string;
    role: string;
    company: string;
  };
  color: string;
}

export const ModuleTestimonial = ({ testimonial, color }: ModuleTestimonialProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".testimonial-card", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="testimonial-card relative p-8 md:p-12 rounded-3xl bg-card border border-border/50">
            {/* Quote icon */}
            <div className={`absolute -top-6 left-8 w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
              <Quote className="w-6 h-6 text-white" />
            </div>

            {/* Quote text */}
            <blockquote className="text-xl md:text-2xl text-foreground leading-relaxed mb-8 mt-4">
              "{testimonial.quote}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold`}>
                {testimonial.author.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="font-semibold text-foreground">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role} · {testimonial.company}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
