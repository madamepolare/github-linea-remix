import { memo } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  "Produit": [
    { label: "Fonctionnalités", href: "/welcome#features" },
    { label: "Tarifs", href: "/welcome#pricing" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "Intégrations", href: "#" },
  ],
  "Solutions": [
    { label: "Architectes", href: "/solutions/architectes" },
    { label: "Architectes d'intérieur", href: "/solutions/architectes-interieur" },
    { label: "Scénographes", href: "/solutions/scenographes" },
    { label: "Agences de Communication", href: "/solutions/agences-communication" },
  ],
  "Entreprise": [
    { label: "À propos", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Carrières", href: "#" },
    { label: "Contact", href: "#" },
  ],
  "Légal": [
    { label: "CGU", href: "#" },
    { label: "Confidentialité", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export const NewFooter = memo(() => {
  return (
    <footer className="bg-pastel-cream border-t border-border/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/welcome" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-semibold text-foreground tracking-tight">
                LINEA
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              La plateforme tout-en-un pour gérer vos projets créatifs avec élégance et efficacité.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/80 transition-all"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/80 transition-all"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/80 transition-all"
              >
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground text-sm mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LINEA. Tous droits réservés.
          </p>
          <p className="text-sm text-muted-foreground">
            Fait avec 💜 pour les créatifs
          </p>
        </div>
      </div>
    </footer>
  );
});

NewFooter.displayName = "NewFooter";
