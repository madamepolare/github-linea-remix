import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, FolderKanban, Users, FileText, Trophy, CalendarDays, UsersRound, Building2, Palette, Theater } from "lucide-react";
import gsap from "gsap";

const modules = [
  {
    slug: "projets",
    title: "Gestion de projets",
    description: "Phases, livrables et délais",
    icon: FolderKanban,
  },
  {
    slug: "crm",
    title: "CRM intégré",
    description: "Clients et opportunités",
    icon: Users,
  },
  {
    slug: "commercial",
    title: "Devis & Facturation",
    description: "Propositions commerciales",
    icon: FileText,
  },
  {
    slug: "appels-offres",
    title: "Appels d'offres",
    description: "Réponses assistées par IA",
    icon: Trophy,
  },
  {
    slug: "planning",
    title: "Planning chantier",
    description: "Interventions et CR",
    icon: CalendarDays,
  },
  {
    slug: "collaboration",
    title: "Collaboration",
    description: "Équipe et notifications",
    icon: UsersRound,
  },
];

const solutions = [
  {
    slug: "architectes",
    title: "Architectes",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
  },
  {
    slug: "architectes-interieur",
    title: "Architectes d'intérieur",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
  },
  {
    slug: "scenographes",
    title: "Scénographes",
    icon: Theater,
    color: "from-purple-500 to-violet-600",
  },
];

interface MegaMenuProps {
  onClose?: () => void;
}

export const MegaMenu = ({ onClose }: MegaMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
      );
      gsap.fromTo(
        ".megamenu-item",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.03, duration: 0.2, ease: "power2.out", delay: 0.1 }
      );
    }
  }, [isOpen]);

  const handleItemClick = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
      >
        Modules
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          ref={contentRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[640px] bg-background border border-border rounded-xl shadow-xl p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.slug}
                  to={`/modules/${module.slug}`}
                  onClick={handleItemClick}
                  className="megamenu-item flex items-start gap-4 p-4 rounded-lg hover:bg-muted transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {module.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Solutions par métier */}
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Par métier
            </p>
            <div className="flex flex-wrap gap-2">
              {solutions.map((solution) => {
                const Icon = solution.icon;
                return (
                  <Link
                    key={solution.slug}
                    to={`/solutions/${solution.slug}`}
                    onClick={handleItemClick}
                    className="megamenu-item flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className={`w-6 h-6 rounded bg-gradient-to-br ${solution.color} flex items-center justify-center`}>
                      <Icon className="text-white" size={14} />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {solution.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              to="/welcome#features"
              onClick={handleItemClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir toutes les fonctionnalités →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
