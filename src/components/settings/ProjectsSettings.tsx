import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { ProjectCategoriesSettings } from "./ProjectCategoriesSettings";
import { FolderKanban, FileText, Layers, Briefcase } from "lucide-react";
import { useWorkspaceDiscipline } from "@/hooks/useDiscipline";
import { useMemo } from "react";

// Types/sous-types structure - chaque type a ses sous-types liés
interface ProjectTypeConfig {
  key: string;
  label: string;
  color: string;
  description: string;
  subtypes: Array<{ key: string; label: string; color: string; description: string }>;
}

// ============================================
// ARCHITECTURE & SPATIAL DESIGN
// ============================================
const ARCHITECTURE_TYPES: ProjectTypeConfig[] = [
  {
    key: "architecture",
    label: "Architecture",
    color: "#3B82F6",
    description: "Construction, rénovation, permis de construire",
    subtypes: [
      { key: "construction_neuve", label: "Construction neuve", color: "#3B82F6", description: "Bâtiment neuf" },
      { key: "renovation", label: "Rénovation", color: "#F59E0B", description: "Réhabilitation et rénovation" },
      { key: "extension", label: "Extension", color: "#8B5CF6", description: "Extension de bâtiment" },
      { key: "surelevation", label: "Surélévation", color: "#06B6D4", description: "Surélévation de bâtiment" },
      { key: "restructuration", label: "Restructuration", color: "#EC4899", description: "Restructuration lourde" },
      { key: "permis", label: "Permis de construire", color: "#10B981", description: "Dépôt de permis uniquement" },
      { key: "concours", label: "Concours", color: "#6366F1", description: "Concours d'architecture" },
    ],
  },
  {
    key: "interior",
    label: "Intérieur",
    color: "#8B5CF6",
    description: "Aménagement intérieur, design d'espace",
    subtypes: [
      { key: "conception", label: "Conception globale", color: "#8B5CF6", description: "Conception complète" },
      { key: "decoration", label: "Décoration", color: "#EC4899", description: "Décoration et stylisme" },
      { key: "mobilier", label: "Mobilier sur-mesure", color: "#F59E0B", description: "Design et fabrication" },
      { key: "renovation_int", label: "Rénovation intérieure", color: "#3B82F6", description: "Rénovation intérieure" },
    ],
  },
  {
    key: "scenography",
    label: "Scénographie",
    color: "#F59E0B",
    description: "Exposition, événementiel, muséographie",
    subtypes: [
      { key: "expo_permanente", label: "Expo permanente", color: "#3B82F6", description: "Scénographie permanente" },
      { key: "expo_temporaire", label: "Expo temporaire", color: "#F59E0B", description: "Scénographie temporaire" },
      { key: "expo_itinerante", label: "Expo itinérante", color: "#8B5CF6", description: "Exposition itinérante" },
      { key: "museographie", label: "Muséographie", color: "#10B981", description: "Parcours muséographique" },
      { key: "stand", label: "Stand salon", color: "#EC4899", description: "Stand de salon professionnel" },
      { key: "evenement", label: "Événement", color: "#06B6D4", description: "Scénographie événementielle" },
    ],
  },
  {
    key: "urbanisme",
    label: "Urbanisme",
    color: "#10B981",
    description: "Aménagement urbain, master plan",
    subtypes: [
      { key: "masterplan", label: "Master plan", color: "#10B981", description: "Plan directeur" },
      { key: "etude_urbaine", label: "Étude urbaine", color: "#3B82F6", description: "Étude et diagnostic" },
      { key: "zac", label: "ZAC", color: "#8B5CF6", description: "Zone d'aménagement concerté" },
      { key: "lotissement", label: "Lotissement", color: "#F59E0B", description: "Conception de lotissement" },
    ],
  },
  {
    key: "paysage",
    label: "Paysage",
    color: "#22C55E",
    description: "Aménagement paysager, espaces verts",
    subtypes: [
      { key: "jardin", label: "Jardin privé", color: "#22C55E", description: "Conception de jardin" },
      { key: "parc", label: "Parc public", color: "#10B981", description: "Aménagement de parc" },
      { key: "place", label: "Place urbaine", color: "#3B82F6", description: "Aménagement de place" },
      { key: "toiture_vegetale", label: "Toiture végétale", color: "#84CC16", description: "Toiture et terrasse" },
    ],
  },
];

// ============================================
// INTERIOR DESIGN AGENCY
// ============================================
const INTERIOR_TYPES: ProjectTypeConfig[] = [
  {
    key: "amenagement",
    label: "Aménagement",
    color: "#8B5CF6",
    description: "Aménagement intérieur complet",
    subtypes: [
      { key: "conception_complete", label: "Conception complète", color: "#8B5CF6", description: "De A à Z" },
      { key: "space_planning", label: "Space planning", color: "#3B82F6", description: "Optimisation d'espace" },
      { key: "cloisonnement", label: "Cloisonnement", color: "#F59E0B", description: "Redistribution" },
    ],
  },
  {
    key: "retail",
    label: "Retail",
    color: "#F59E0B",
    description: "Boutiques et espaces commerciaux",
    subtypes: [
      { key: "boutique", label: "Boutique", color: "#F59E0B", description: "Magasin de détail" },
      { key: "flagship", label: "Flagship store", color: "#EF4444", description: "Magasin phare" },
      { key: "pop_up", label: "Pop-up store", color: "#EC4899", description: "Boutique éphémère" },
      { key: "corner", label: "Corner / Shop-in-shop", color: "#8B5CF6", description: "Espace dans magasin" },
    ],
  },
  {
    key: "residential",
    label: "Résidentiel",
    color: "#3B82F6",
    description: "Appartements et maisons",
    subtypes: [
      { key: "appartement", label: "Appartement", color: "#3B82F6", description: "Appartement" },
      { key: "maison", label: "Maison", color: "#10B981", description: "Maison individuelle" },
      { key: "duplex", label: "Duplex / Triplex", color: "#8B5CF6", description: "Logement sur plusieurs niveaux" },
      { key: "loft", label: "Loft", color: "#F59E0B", description: "Espace atypique" },
    ],
  },
  {
    key: "hospitality",
    label: "Hospitality",
    color: "#EC4899",
    description: "Hôtels, restaurants, bars",
    subtypes: [
      { key: "hotel", label: "Hôtel", color: "#EC4899", description: "Hôtellerie" },
      { key: "restaurant", label: "Restaurant", color: "#EF4444", description: "Restauration" },
      { key: "bar", label: "Bar / Lounge", color: "#8B5CF6", description: "Bar et lounge" },
      { key: "spa", label: "Spa / Wellness", color: "#06B6D4", description: "Espace bien-être" },
    ],
  },
  {
    key: "workspace",
    label: "Bureaux",
    color: "#10B981",
    description: "Espaces de travail",
    subtypes: [
      { key: "siege_social", label: "Siège social", color: "#10B981", description: "Headquarters" },
      { key: "openspace", label: "Open space", color: "#3B82F6", description: "Espace ouvert" },
      { key: "coworking", label: "Coworking", color: "#F59E0B", description: "Espace partagé" },
      { key: "flex_office", label: "Flex office", color: "#8B5CF6", description: "Bureaux flexibles" },
    ],
  },
];

// ============================================
// SCENOGRAPHY AGENCY
// ============================================
const SCENOGRAPHY_TYPES: ProjectTypeConfig[] = [
  {
    key: "exposition",
    label: "Exposition",
    color: "#8B5CF6",
    description: "Exposition temporaire ou permanente",
    subtypes: [
      { key: "permanente", label: "Permanente", color: "#3B82F6", description: "Expo permanente" },
      { key: "temporaire", label: "Temporaire", color: "#F59E0B", description: "Expo temporaire" },
      { key: "itinerante", label: "Itinérante", color: "#8B5CF6", description: "Expo itinérante" },
    ],
  },
  {
    key: "musee",
    label: "Muséographie",
    color: "#3B82F6",
    description: "Parcours muséographique",
    subtypes: [
      { key: "parcours", label: "Parcours de visite", color: "#3B82F6", description: "Parcours visiteur" },
      { key: "interpretation", label: "Centre d'interprétation", color: "#10B981", description: "Centre interprétatif" },
      { key: "memorial", label: "Mémorial", color: "#6B7280", description: "Lieu de mémoire" },
    ],
  },
  {
    key: "evenement",
    label: "Événement",
    color: "#F59E0B",
    description: "Scénographie événementielle",
    subtypes: [
      { key: "lancement", label: "Lancement produit", color: "#F59E0B", description: "Lancement de produit" },
      { key: "convention", label: "Convention", color: "#3B82F6", description: "Convention d'entreprise" },
      { key: "inauguration", label: "Inauguration", color: "#EC4899", description: "Inauguration" },
      { key: "festival", label: "Festival", color: "#8B5CF6", description: "Festival et événement culturel" },
    ],
  },
  {
    key: "stand",
    label: "Stand",
    color: "#10B981",
    description: "Stand de salon professionnel",
    subtypes: [
      { key: "stand_standard", label: "Stand standard", color: "#10B981", description: "Stand modulaire" },
      { key: "stand_sur_mesure", label: "Stand sur-mesure", color: "#8B5CF6", description: "Stand personnalisé" },
      { key: "pavillon", label: "Pavillon", color: "#F59E0B", description: "Grand espace" },
    ],
  },
  {
    key: "spectacle",
    label: "Spectacle",
    color: "#EC4899",
    description: "Décor de spectacle",
    subtypes: [
      { key: "theatre", label: "Théâtre", color: "#EC4899", description: "Décor théâtral" },
      { key: "concert", label: "Concert", color: "#EF4444", description: "Scène de concert" },
      { key: "danse", label: "Danse", color: "#8B5CF6", description: "Spectacle de danse" },
      { key: "opera", label: "Opéra", color: "#F59E0B", description: "Décor d'opéra" },
    ],
  },
];

// ============================================
// COMMUNICATION & CREATIVE AGENCY
// ============================================
const COMMUNICATION_TYPES: ProjectTypeConfig[] = [
  {
    key: "campagne",
    label: "Campagne",
    color: "#3B82F6",
    description: "Campagne de communication 360°",
    subtypes: [
      { key: "360", label: "Campagne 360°", color: "#3B82F6", description: "Multi-canal" },
      { key: "lancement_produit", label: "Lancement produit", color: "#F59E0B", description: "Lancement de produit" },
      { key: "notoriete", label: "Notoriété", color: "#8B5CF6", description: "Campagne de notoriété" },
      { key: "acquisition", label: "Acquisition", color: "#10B981", description: "Campagne d'acquisition" },
      { key: "influence", label: "Influence", color: "#EC4899", description: "Marketing d'influence" },
    ],
  },
  {
    key: "branding",
    label: "Branding",
    color: "#8B5CF6",
    description: "Identité visuelle et branding",
    subtypes: [
      { key: "identite_visuelle", label: "Identité visuelle", color: "#8B5CF6", description: "Logo et charte graphique" },
      { key: "rebranding", label: "Rebranding", color: "#F59E0B", description: "Refonte d'identité" },
      { key: "naming", label: "Naming", color: "#3B82F6", description: "Création de nom" },
      { key: "brand_book", label: "Brand book", color: "#10B981", description: "Guide de marque" },
      { key: "packaging", label: "Packaging", color: "#EC4899", description: "Design de packaging" },
    ],
  },
  {
    key: "design_graphique",
    label: "Design graphique",
    color: "#EC4899",
    description: "Création graphique et direction artistique",
    subtypes: [
      { key: "direction_artistique", label: "Direction artistique", color: "#EC4899", description: "DA globale" },
      { key: "illustration", label: "Illustration", color: "#8B5CF6", description: "Illustration sur-mesure" },
      { key: "iconographie", label: "Iconographie", color: "#3B82F6", description: "Système d'icônes" },
      { key: "infographie", label: "Infographie", color: "#10B981", description: "Visualisation de données" },
      { key: "affiche", label: "Affiche", color: "#F59E0B", description: "Création d'affiches" },
    ],
  },
  {
    key: "supports",
    label: "Supports de com.",
    color: "#F59E0B",
    description: "Supports print et digital",
    subtypes: [
      { key: "plaquette", label: "Plaquette", color: "#F59E0B", description: "Plaquette commerciale" },
      { key: "brochure", label: "Brochure", color: "#3B82F6", description: "Brochure produit" },
      { key: "catalogue", label: "Catalogue", color: "#8B5CF6", description: "Catalogue produits" },
      { key: "flyer", label: "Flyer", color: "#10B981", description: "Flyer et tract" },
      { key: "carte_visite", label: "Carte de visite", color: "#EC4899", description: "Carte de visite" },
      { key: "kakemono", label: "Kakemono / Roll-up", color: "#06B6D4", description: "PLV" },
    ],
  },
  {
    key: "edition",
    label: "Édition / Print",
    color: "#10B981",
    description: "Édition, mise en page, impression",
    subtypes: [
      { key: "magazine", label: "Magazine", color: "#10B981", description: "Magazine et journal" },
      { key: "livre", label: "Livre", color: "#3B82F6", description: "Livre et monographie" },
      { key: "rapport_annuel", label: "Rapport annuel", color: "#8B5CF6", description: "Rapport annuel" },
      { key: "newsletter", label: "Newsletter", color: "#F59E0B", description: "Newsletter imprimée" },
    ],
  },
  {
    key: "video",
    label: "Vidéo",
    color: "#EF4444",
    description: "Production vidéo",
    subtypes: [
      { key: "spot_pub", label: "Spot publicitaire", color: "#EF4444", description: "Film publicitaire" },
      { key: "film_corporate", label: "Film corporate", color: "#3B82F6", description: "Film d'entreprise" },
      { key: "interview", label: "Interview", color: "#8B5CF6", description: "Témoignage / Interview" },
      { key: "captation", label: "Captation", color: "#F59E0B", description: "Captation événement" },
      { key: "tutoriel", label: "Tutoriel", color: "#10B981", description: "Vidéo tutorielle" },
      { key: "teaser", label: "Teaser", color: "#EC4899", description: "Teaser / Bande-annonce" },
    ],
  },
  {
    key: "photo",
    label: "Photo",
    color: "#EC4899",
    description: "Shooting photo et retouche",
    subtypes: [
      { key: "packshot", label: "Packshot", color: "#EC4899", description: "Photo produit" },
      { key: "portrait", label: "Portrait", color: "#8B5CF6", description: "Portrait corporate" },
      { key: "reportage", label: "Reportage", color: "#3B82F6", description: "Reportage photo" },
      { key: "lifestyle", label: "Lifestyle", color: "#F59E0B", description: "Photo lifestyle" },
      { key: "architecture_photo", label: "Architecture", color: "#10B981", description: "Photo d'architecture" },
      { key: "culinaire", label: "Culinaire", color: "#EF4444", description: "Photo culinaire" },
    ],
  },
  {
    key: "motion",
    label: "Motion Design",
    color: "#06B6D4",
    description: "Animation et motion graphics",
    subtypes: [
      { key: "motion_logo", label: "Logo animé", color: "#06B6D4", description: "Animation de logo" },
      { key: "explainer", label: "Explainer video", color: "#3B82F6", description: "Vidéo explicative" },
      { key: "generique", label: "Générique", color: "#8B5CF6", description: "Générique et habillage" },
      { key: "animation_2d", label: "Animation 2D", color: "#F59E0B", description: "Animation 2D" },
      { key: "animation_3d", label: "Animation 3D", color: "#EC4899", description: "Animation 3D" },
      { key: "gif", label: "GIF / Stickers", color: "#10B981", description: "GIF et stickers" },
    ],
  },
  {
    key: "web",
    label: "Web / Digital",
    color: "#6366F1",
    description: "Site web, UX/UI, applications",
    subtypes: [
      { key: "site_vitrine", label: "Site vitrine", color: "#6366F1", description: "Site de présentation" },
      { key: "site_ecommerce", label: "Site e-commerce", color: "#10B981", description: "Boutique en ligne" },
      { key: "landing_page", label: "Landing page", color: "#F59E0B", description: "Page de conversion" },
      { key: "webapp", label: "Web app", color: "#3B82F6", description: "Application web" },
      { key: "ux_ui", label: "UX/UI Design", color: "#EC4899", description: "Design d'interface" },
      { key: "emailing", label: "Emailing", color: "#8B5CF6", description: "Template email" },
    ],
  },
  {
    key: "social",
    label: "Social Media",
    color: "#F97316",
    description: "Réseaux sociaux et community",
    subtypes: [
      { key: "strategie_social", label: "Stratégie social media", color: "#F97316", description: "Stratégie RS" },
      { key: "community", label: "Community management", color: "#3B82F6", description: "Animation communauté" },
      { key: "contenus_rs", label: "Création de contenus", color: "#8B5CF6", description: "Posts et stories" },
      { key: "social_ads", label: "Social Ads", color: "#EF4444", description: "Publicité réseaux sociaux" },
      { key: "influence_rs", label: "Influence", color: "#EC4899", description: "Partenariats influenceurs" },
    ],
  },
];

// Map discipline to types
const PROJECT_TYPES_BY_DISCIPLINE: Record<string, ProjectTypeConfig[]> = {
  architecture: ARCHITECTURE_TYPES,
  interior: INTERIOR_TYPES,
  scenography: SCENOGRAPHY_TYPES,
  communication: COMMUNICATION_TYPES,
};

// Default fallback
const DEFAULT_PROJECT_TYPES = ARCHITECTURE_TYPES;

// Default deliverable types (shared across all disciplines)
const DEFAULT_DELIVERABLE_TYPES = [
  { key: "plan", label: "Plans", color: "#3B82F6", description: "Plans techniques (PDF, DWG)" },
  { key: "3d", label: "3D / Rendus", color: "#8B5CF6", description: "Images 3D, maquettes numériques" },
  { key: "document", label: "Documents", color: "#6B7280", description: "Rapports, études, notes" },
  { key: "presentation", label: "Présentation", color: "#EC4899", description: "Présentations client" },
  { key: "cctp", label: "CCTP", color: "#F59E0B", description: "Cahiers des clauses techniques" },
  { key: "estimatif", label: "Estimatif", color: "#10B981", description: "Estimations budgétaires" },
];

export function ProjectsSettings() {
  const { data: discipline } = useWorkspaceDiscipline();
  
  // Get project types based on current discipline
  const disciplineTypes = useMemo(() => {
    if (!discipline?.slug) return DEFAULT_PROJECT_TYPES;
    return PROJECT_TYPES_BY_DISCIPLINE[discipline.slug] || DEFAULT_PROJECT_TYPES;
  }, [discipline?.slug]);

  // Extract flat list for types manager
  const projectTypes = useMemo(() => {
    return disciplineTypes.map(t => ({
      key: t.key,
      label: t.label,
      color: t.color,
      description: t.description,
    }));
  }, [disciplineTypes]);

  // Flatten all subtypes with parent reference
  const projectSubtypes = useMemo(() => {
    return disciplineTypes.flatMap(type =>
      type.subtypes.map(subtype => ({
        key: subtype.key,
        label: subtype.label,
        color: subtype.color,
        description: `${type.label} → ${subtype.description}`,
      }))
    );
  }, [disciplineTypes]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configuration des projets</h3>
        <p className="text-sm text-muted-foreground">
          Gérez les types de projets, sous-types et catégories de livrables
        </p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="categories" className="gap-1.5 text-xs">
            <Briefcase className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-1.5 text-xs">
            <FolderKanban className="h-4 w-4" />
            Types de projet
          </TabsTrigger>
          <TabsTrigger value="subtypes" className="gap-1.5 text-xs">
            <Layers className="h-4 w-4" />
            Sous-types
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1.5 text-xs">
            <FileText className="h-4 w-4" />
            Livrables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <ProjectCategoriesSettings />
        </TabsContent>

        <TabsContent value="types" className="mt-6">
          <GenericSettingsManager
            settingType="project_types"
            title="Types de projet"
            description={`Catégories de projets pour ${discipline?.name || 'votre discipline'}`}
            icon={<FolderKanban className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={projectTypes}
          />
        </TabsContent>

        <TabsContent value="subtypes" className="mt-6">
          <GenericSettingsManager
            settingType="project_subtypes"
            title="Sous-types de projet"
            description="Sous-catégories pour affiner vos types de projets"
            icon={<Layers className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={projectSubtypes}
          />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <GenericSettingsManager
            settingType="tags"
            title="Types de livrables"
            description="Catégories de documents et livrables"
            icon={<FileText className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={DEFAULT_DELIVERABLE_TYPES}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export for use in other components
export { PROJECT_TYPES_BY_DISCIPLINE, ARCHITECTURE_TYPES, INTERIOR_TYPES, SCENOGRAPHY_TYPES, COMMUNICATION_TYPES };
export type { ProjectTypeConfig };
