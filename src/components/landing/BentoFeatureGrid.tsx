import * as React from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { ArrowRight, FolderKanban, Users, FileText, Trophy, CalendarDays, UsersRound } from "lucide-react";

interface BentoFeature {
  title: string;
  description: string;
  slug: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  size: "large" | "medium" | "small";
}

const features: BentoFeature[] = [
  {
    title: "Gestion de projets",
    description: "Suivez vos projets de A à Z avec une vue complète sur les phases, livrables et délais. Tableau Kanban, timeline Gantt et suivi financier intégrés.",
    slug: "projets",
    icon: <FolderKanban size={28} />,
    color: "text-blue-600",
    bgColor: "bg-pastel-blue",
    size: "large",
  },
  {
    title: "CRM intégré",
    description: "Gérez vos clients, contacts et opportunités commerciales en un seul endroit.",
    slug: "crm",
    icon: <Users size={28} />,
    color: "text-pink-600",
    bgColor: "bg-pastel-pink",
    size: "medium",
  },
  {
    title: "Devis & Facturation",
    description: "Créez des propositions commerciales professionnelles.",
    slug: "commercial",
    icon: <FileText size={28} />,
    color: "text-emerald-600",
    bgColor: "bg-pastel-mint",
    size: "small",
  },
  {
    title: "Planning",
    description: "Planifiez chantiers et productions.",
    slug: "planning",
    icon: <CalendarDays size={28} />,
    color: "text-purple-600",
    bgColor: "bg-pastel-lavender",
    size: "small",
  },
  {
    title: "Appels d'offres",
    description: "Centralisez vos réponses aux appels d'offres avec l'aide de l'intelligence artificielle. Analysez les cahiers des charges et générez vos mémoires techniques.",
    slug: "appels-offres",
    icon: <Trophy size={28} />,
    color: "text-orange-600",
    bgColor: "bg-pastel-peach",
    size: "large",
  },
  {
    title: "Collaboration",
    description: "Travaillez en équipe avec des espaces partagés.",
    slug: "collaboration",
    icon: <UsersRound size={28} />,
    color: "text-rose-600",
    bgColor: "bg-pastel-coral",
    size: "medium",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export const BentoFeatureGrid = React.forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <motion.div
        ref={ref}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        {...props}
      >
        {features.map((feature) => {
          const colSpan = feature.size === "large" ? "lg:col-span-2" : "lg:col-span-1";
          const rowSpan = feature.size === "large" ? "lg:row-span-2" : "";
          
          return (
            <motion.div
              key={feature.slug}
              variants={itemVariants}
              transition={{ duration: 0.6 }}
              className={`${colSpan} ${rowSpan}`}
            >
              <Link
                to={`/modules/${feature.slug}`}
                className={`group block h-full p-6 lg:p-8 rounded-3xl ${feature.bgColor} transition-all duration-500 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1`}
              >
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-3 group-hover:text-foreground/80 transition-colors">
                      {feature.title}
                    </h3>
                    <p className={`text-muted-foreground leading-relaxed ${feature.size === "large" ? "text-base" : "text-sm"}`}>
                      {feature.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground/70 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                    Découvrir
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }
);

BentoFeatureGrid.displayName = "BentoFeatureGrid";
