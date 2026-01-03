import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import gsap from "gsap";

export const LandingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    gsap.from(".nav-item", {
      opacity: 0,
      y: -20,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
      delay: 0.2,
    });
  }, []);

  const navLinks = [
    { href: "#features", label: "Fonctionnalités" },
    { href: "#pricing", label: "Tarifs" },
    { href: "#testimonials", label: "Témoignages" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/welcome" className="nav-item flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              ARCHIMIND
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-item text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth" className="nav-item">
              <Button variant="ghost" className="font-medium">
                Se connecter
              </Button>
            </Link>
            <Link to="/auth" className="nav-item">
              <Button className="font-medium bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity">
                Commencer gratuitement
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 space-y-3 border-t border-border">
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full">
                  Se connecter
                </Button>
              </Link>
              <Link to="/auth" className="block">
                <Button className="w-full">Commencer gratuitement</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
