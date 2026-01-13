import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { motion, AnimatePresence } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const NewLandingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    { slug: "agences-communication", label: "Agences de Communication" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-border/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/welcome" className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center"
            >
              <span className="text-background font-bold text-xl">L</span>
            </motion.div>
            <span className="text-xl font-semibold text-foreground tracking-tight">
              LINEA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {/* Solutions dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent text-muted-foreground hover:text-foreground font-medium h-10 px-4">
                    Solutions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[280px] p-4 bg-white rounded-2xl">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Par métier</p>
                      <div className="space-y-1">
                        {mobileSolutions.map((solution) => (
                          <Link
                            key={solution.slug}
                            to={`/solutions/${solution.slug}`}
                            className="block p-3 rounded-xl hover:bg-pastel-cream transition-colors"
                          >
                            <span className="font-medium text-foreground">{solution.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Modules MegaMenu */}
            <div>
              <MegaMenu />
            </div>

            <a
              href="/welcome#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium px-4 py-2"
            >
              Tarifs
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="font-medium h-10 px-5">
                Se connecter
              </Button>
            </Link>
            <Link to="/onboarding">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="font-medium h-10 px-5 bg-foreground text-background hover:bg-foreground/90 rounded-full">
                  Démarrer
                </Button>
              </motion.div>
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-border/30"
          >
            <div className="px-4 py-6 space-y-2">
              {/* Solutions accordion */}
              <div>
                <button
                  onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                  className="flex items-center justify-between w-full text-foreground py-3 font-medium"
                >
                  Solutions
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileSolutionsOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {mobileSolutionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-2 mt-2"
                    >
                      {mobileSolutions.map((solution) => (
                        <Link
                          key={solution.slug}
                          to={`/solutions/${solution.slug}`}
                          className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {solution.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Modules accordion */}
              <div>
                <button
                  onClick={() => setMobileModulesOpen(!mobileModulesOpen)}
                  className="flex items-center justify-between w-full text-foreground py-3 font-medium"
                >
                  Modules
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${mobileModulesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {mobileModulesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-2 mt-2"
                    >
                      {mobileModules.map((module) => (
                        <Link
                          key={module.slug}
                          to={`/modules/${module.slug}`}
                          className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {module.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="/welcome#pricing"
                className="block text-foreground py-3 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tarifs
              </a>

              <div className="pt-4 space-y-3 border-t border-border/50">
                <Link to="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/onboarding" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-foreground text-background rounded-full">
                    Démarrer
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
