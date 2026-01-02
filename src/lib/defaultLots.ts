// Default lots templates per project type

export interface DefaultLot {
  name: string;
  description?: string;
}

export interface LotTemplate {
  name: string;
  lots: DefaultLot[];
}

export const DEFAULT_LOTS_TEMPLATES: Record<string, LotTemplate[]> = {
  interior: [
    {
      name: "Aménagement bureaux",
      lots: [
        { name: "Démolition / Dépose", description: "Travaux de démolition et dépose" },
        { name: "Cloisons / Plâtrerie", description: "Cloisons sèches et plâtrerie" },
        { name: "Menuiserie intérieure", description: "Portes, placards, agencement" },
        { name: "Électricité", description: "Distribution électrique et éclairage" },
        { name: "Plomberie / CVC", description: "Sanitaires et climatisation" },
        { name: "Revêtements sols", description: "Moquette, parquet, carrelage" },
        { name: "Peinture", description: "Peinture et finitions murales" },
        { name: "Mobilier", description: "Fourniture et installation mobilier" },
        { name: "Signalétique", description: "Signalétique intérieure" },
      ]
    },
    {
      name: "Commerce / Retail",
      lots: [
        { name: "Démolition", description: "Travaux de démolition" },
        { name: "Gros œuvre", description: "Maçonnerie et structure" },
        { name: "Menuiserie / Agencement", description: "Mobilier sur mesure et agencement" },
        { name: "Électricité", description: "Éclairage et distribution" },
        { name: "Plomberie", description: "Sanitaires" },
        { name: "CVC", description: "Climatisation et ventilation" },
        { name: "Revêtements", description: "Sols et murs" },
        { name: "Vitrine / Façade", description: "Devanture commerciale" },
        { name: "Enseigne", description: "Enseigne et signalétique" },
        { name: "Sécurité incendie", description: "Alarme et extincteurs" },
      ]
    },
    {
      name: "Résidentiel",
      lots: [
        { name: "Démolition", description: "Démolition et évacuation" },
        { name: "Plâtrerie / Cloisons", description: "Cloisonnement et plafonds" },
        { name: "Menuiserie", description: "Portes et placards" },
        { name: "Électricité", description: "Installation électrique" },
        { name: "Plomberie", description: "Sanitaires et eau" },
        { name: "Chauffage / Clim", description: "Chauffage et climatisation" },
        { name: "Carrelage", description: "Carrelage et faïence" },
        { name: "Parquet", description: "Parquet et stratifié" },
        { name: "Peinture", description: "Peinture et papier peint" },
        { name: "Cuisine", description: "Cuisine équipée" },
        { name: "Salle de bains", description: "Mobilier sanitaire" },
      ]
    }
  ],
  architecture: [
    {
      name: "Construction neuve",
      lots: [
        { name: "Terrassement / VRD", description: "Terrassement et voiries" },
        { name: "Fondations", description: "Fondations et infrastructure" },
        { name: "Gros œuvre", description: "Structure et maçonnerie" },
        { name: "Charpente", description: "Charpente bois ou métal" },
        { name: "Couverture", description: "Toiture et étanchéité" },
        { name: "Menuiseries extérieures", description: "Fenêtres et portes" },
        { name: "Isolation", description: "Isolation thermique et acoustique" },
        { name: "Plâtrerie / Cloisons", description: "Cloisonnement intérieur" },
        { name: "Électricité courant fort", description: "Distribution électrique" },
        { name: "Électricité courant faible", description: "Réseaux et télécom" },
        { name: "Plomberie sanitaire", description: "Réseaux sanitaires" },
        { name: "Chauffage / Ventilation", description: "CVC" },
        { name: "Menuiseries intérieures", description: "Portes et agencement" },
        { name: "Carrelage / Faïence", description: "Revêtements céramiques" },
        { name: "Sols souples", description: "Parquet et sols souples" },
        { name: "Peinture", description: "Peinture et finitions" },
        { name: "Façades", description: "Ravalement et enduits" },
        { name: "Espaces verts", description: "Aménagements paysagers" },
        { name: "Ascenseur", description: "Ascenseur et monte-charge" },
      ]
    },
    {
      name: "Rénovation",
      lots: [
        { name: "Démolition / Curage", description: "Démolition sélective" },
        { name: "Gros œuvre", description: "Reprises structurelles" },
        { name: "Étanchéité", description: "Toiture et terrasses" },
        { name: "Menuiseries extérieures", description: "Remplacement fenêtres" },
        { name: "Isolation", description: "Isolation par l'intérieur/extérieur" },
        { name: "Plâtrerie", description: "Cloisons et plafonds" },
        { name: "Électricité", description: "Mise aux normes électrique" },
        { name: "Plomberie", description: "Réseaux sanitaires" },
        { name: "Chauffage", description: "Système de chauffage" },
        { name: "Menuiseries intérieures", description: "Portes et placards" },
        { name: "Revêtements sols", description: "Carrelage et parquet" },
        { name: "Peinture", description: "Peinture et finitions" },
        { name: "Façade", description: "Ravalement de façade" },
      ]
    }
  ],
  scenography: [
    {
      name: "Exposition permanente",
      lots: [
        { name: "Scénographie", description: "Conception scénographique" },
        { name: "Graphisme", description: "Identité visuelle et signalétique" },
        { name: "Menuiserie / Agencement", description: "Mobiliers et cimaises" },
        { name: "Éclairage", description: "Éclairage scénographique" },
        { name: "Audiovisuel", description: "Dispositifs AV et interactifs" },
        { name: "Multimédia", description: "Bornes et applications" },
        { name: "Peinture / Décor", description: "Peinture et décors" },
        { name: "Soclage / Vitrines", description: "Présentoirs et vitrines" },
        { name: "Transport / Accrochage", description: "Manipulation des œuvres" },
      ]
    },
    {
      name: "Exposition temporaire",
      lots: [
        { name: "Scénographie", description: "Conception scénographique" },
        { name: "Graphisme", description: "Signalétique temporaire" },
        { name: "Menuiserie", description: "Cloisons et présentoirs" },
        { name: "Éclairage", description: "Éclairage d'ambiance" },
        { name: "Multimédia", description: "Dispositifs numériques" },
        { name: "Transport / Accrochage", description: "Installation des œuvres" },
        { name: "Sécurité", description: "Dispositifs de sécurité" },
      ]
    },
    {
      name: "Événementiel",
      lots: [
        { name: "Conception", description: "Conception et direction artistique" },
        { name: "Structure", description: "Structures temporaires" },
        { name: "Décor", description: "Décors et accessoires" },
        { name: "Éclairage", description: "Éclairage événementiel" },
        { name: "Son", description: "Sonorisation" },
        { name: "Vidéo", description: "Projection et écrans" },
        { name: "Mobilier", description: "Mobilier événementiel" },
        { name: "Signalétique", description: "Signalétique directionnelle" },
        { name: "Logistique", description: "Installation et démontage" },
      ]
    }
  ]
};

export function getDefaultLotsForProjectType(projectType: string): LotTemplate[] {
  return DEFAULT_LOTS_TEMPLATES[projectType] || [];
}
