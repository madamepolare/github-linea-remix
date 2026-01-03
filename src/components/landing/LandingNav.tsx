import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import gsap from "gsap";

export const LandingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);

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

  const mobileModules = [
    { slug: "projets", label: "Gestion de projets" },
    { slug: "crm", label: "CRM intégré" },
    { slug: "commercial", label: "Devis & Facturation" },
    { slug: "appels-offres", label: "Appels d'offres" },
    { slug: "planning", label: "Planning chantier" },
    { slug: "collaboration", label: "Collaboration" },
  ];

  const mobileSolutions = [
    { slug: "architectes", label: "Architectes" },
    { slug: "architectes-interieur", label: "Architectes d'intérieur" },
    { slug: "scenographes", label: "Scénographes" },
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
              <span className="text-primary-foreground font-bold text-xl">L</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              LINEA SUITE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="nav-item">
              <MegaMenu />
            </div>
            <a
              href="/welcome#pricing"
              className="nav-item text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              Tarifs
            </a>
            <Link
              to="/about"
              className="nav-item text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              À propos
            </Link>
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
          <div className="px-4 py-6 space-y-2">
            {/* Modules accordion */}
            <div>
              <button
                onClick={() => setMobileModulesOpen(!mobileModulesOpen)}
                className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
              >
                Modules
                <ChevronDown
                  size={16}
                  className={`transition-transform ${mobileModulesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileModulesOpen && (
                <div className="pl-4 space-y-2 mt-2">
                  {mobileModules.map((module) => (
                    <Link
                      key={module.slug}
                      to={`/modules/${module.slug}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {module.label}
                    </Link>
                  ))}
                  <div className="pt-2 mt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-2">Par métier</p>
                    {mobileSolutions.map((solution) => (
                      <Link
                        key={solution.slug}
                        to={`/solutions/${solution.slug}`}
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {solution.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <a
              href="/welcome#pricing"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tarifs
            </a>
            <Link
              to="/about"
              className="block text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              À propos
            </Link>
            <div className="pt-4 space-y-3 border-t border-border">
              <Link to="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Se connecter
                </Button>
              </Link>
              <Link to="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full">Commencer gratuitement</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
