// Configuration des appels d'offres par discipline
// Chaque discipline a sa propre configuration de spécialités, documents, critères, etc.

export type DisciplineSlug = 'architecture' | 'scenographie' | 'communication';

export interface TeamSpecialty {
  value: string;
  label: string;
  category?: string;
}

export interface RequiredDocumentDef {
  value: string;
  label: string;
  mandatory: boolean;
}

export interface CriterionTypeDef {
  value: string;
  label: string;
}

export interface MemoireSectionDef {
  value: string;
  label: string;
  description?: string;
}

export interface ClientTypeDef {
  value: string;
  label: string;
}

export interface ProcedureTypeDef {
  value: string;
  label: string;
}

export interface TeamRoleDef {
  value: string;
  label: string;
}

// Champs spécifiques par discipline
export interface DisciplineFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  unit?: string; // "€", "m²", "mois", etc.
  options?: { value: string; label: string }[];
  section: 'general' | 'project' | 'financial' | 'procedure' | 'dates';
  required?: boolean;
}

// Métriques affichées sur la synthèse
export interface DisciplineMetricDef {
  key: string;
  label: string;
  icon: string;
  colorClass: string;
  formatType: 'currency' | 'number' | 'date' | 'text' | 'duration';
  unit?: string;
}

export interface TenderDisciplineConfig {
  slug: DisciplineSlug;
  name: string;
  description: string;
  icon: string;
  
  // Spécialités d'équipe
  teamSpecialties: TeamSpecialty[];
  
  // Documents requis par défaut
  requiredDocuments: {
    candidature: RequiredDocumentDef[];
    offre: RequiredDocumentDef[];
  };
  
  // Types de critères de jugement
  criterionTypes: CriterionTypeDef[];
  
  // Sections de mémoire technique
  memoireSections: MemoireSectionDef[];
  
  // Types de clients
  clientTypes: ClientTypeDef[];
  
  // Types de procédures
  procedureTypes: ProcedureTypeDef[];
  
  // Rôles d'équipe
  teamRoles: TeamRoleDef[];
  
  // Champs spécifiques à la discipline (formulaires)
  specificFields: DisciplineFieldDef[];
  
  // Métriques à afficher sur la synthèse
  keyMetrics: DisciplineMetricDef[];
  
  // Prompts IA spécifiques
  aiPrompts: {
    dceAnalysis: string;
    memoireGeneration: string;
  };
}

// ============= CONFIGURATION ARCHITECTURE =============
export const ARCHITECTURE_CONFIG: TenderDisciplineConfig = {
  slug: 'architecture',
  name: 'Architecture',
  description: 'Projets de construction, réhabilitation, aménagement',
  icon: 'Building2',
  
  teamSpecialties: [
    { value: 'architecte', label: 'Architecte', category: 'moe' },
    { value: 'bet_structure', label: 'BET Structure', category: 'bet' },
    { value: 'bet_fluides', label: 'BET Fluides', category: 'bet' },
    { value: 'bet_electricite', label: 'BET Électricité', category: 'bet' },
    { value: 'thermicien', label: 'Thermicien / RE2020', category: 'bet' },
    { value: 'economiste', label: 'Économiste', category: 'moe' },
    { value: 'acousticien', label: 'Acousticien', category: 'bet' },
    { value: 'paysagiste', label: 'Paysagiste', category: 'moe' },
    { value: 'vrd', label: 'VRD', category: 'bet' },
    { value: 'opc', label: 'OPC', category: 'moe' },
    { value: 'ssi', label: 'SSI', category: 'bet' },
    { value: 'cuisiniste', label: 'Cuisiniste', category: 'bet' },
    { value: 'bet_facade', label: 'BET Façade', category: 'bet' },
    { value: 'geometre', label: 'Géomètre', category: 'bet' },
    { value: 'geotechnicien', label: 'Géotechnicien', category: 'bet' },
    { value: 'scenographe', label: 'Scénographe', category: 'moe' },
    { value: 'eclairagiste', label: 'Éclairagiste', category: 'bet' },
    { value: 'signaletique', label: 'Signalétique', category: 'moe' },
    { value: 'autre', label: 'Autre', category: 'autre' },
  ],
  
  requiredDocuments: {
    candidature: [
      { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: true },
      { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: true },
      { value: 'attestation_assurance', label: 'Attestation d\'assurance', mandatory: true },
      { value: 'attestation_urssaf', label: 'Attestation URSSAF', mandatory: true },
      { value: 'attestation_fiscale', label: 'Attestation fiscale', mandatory: true },
      { value: 'kbis', label: 'Extrait Kbis', mandatory: true },
      { value: 'references', label: 'Références', mandatory: true },
      { value: 'moyens_humains', label: 'Moyens humains', mandatory: false },
      { value: 'moyens_techniques', label: 'Moyens techniques', mandatory: false },
      { value: 'cv_equipe', label: 'CV de l\'équipe', mandatory: false },
    ],
    offre: [
      { value: 'ae', label: 'Acte d\'Engagement', mandatory: true },
      { value: 'memoire_technique', label: 'Mémoire technique', mandatory: true },
      { value: 'dpgf', label: 'DPGF / BPU', mandatory: true },
      { value: 'planning', label: 'Planning prévisionnel', mandatory: false },
      { value: 'note_methodologique', label: 'Note méthodologique', mandatory: false },
      { value: 'dc4', label: 'DC4 - Sous-traitance', mandatory: false },
      { value: 'attestation_visite', label: 'Attestation de visite', mandatory: false },
      { value: 'pieces_graphiques', label: 'Pièces graphiques', mandatory: false },
    ],
  },
  
  criterionTypes: [
    { value: 'price', label: 'Prix' },
    { value: 'technical', label: 'Valeur technique' },
    { value: 'delay', label: 'Délais' },
    { value: 'environmental', label: 'Environnement' },
    { value: 'social', label: 'Social' },
  ],
  
  memoireSections: [
    { value: 'presentation', label: 'Présentation de l\'équipe', description: 'Présentation du groupement et des compétences' },
    { value: 'references', label: 'Références et expériences', description: 'Projets similaires réalisés' },
    { value: 'methodologie', label: 'Note méthodologique', description: 'Organisation et méthode de travail' },
    { value: 'equipe', label: 'Moyens humains', description: 'Équipe dédiée au projet' },
    { value: 'planning', label: 'Planning prévisionnel', description: 'Calendrier d\'intervention' },
    { value: 'qualite', label: 'Démarche qualité', description: 'Contrôle qualité et suivi' },
    { value: 'environnement', label: 'Approche environnementale', description: 'Démarche RE2020, matériaux, énergie' },
    { value: 'autre', label: 'Autre section' },
  ],
  
  clientTypes: [
    { value: 'client_public', label: 'MOA Public' },
    { value: 'bailleur_social', label: 'Bailleur social' },
    { value: 'collectivite', label: 'Collectivité territoriale' },
    { value: 'etat', label: 'État / Ministère' },
    { value: 'hopital', label: 'Établissement de santé' },
    { value: 'universite', label: 'Université / Enseignement' },
    { value: 'etablissement_public', label: 'Établissement public' },
    { value: 'prive', label: 'Client privé' },
    { value: 'autre', label: 'Autre' },
  ],
  
  procedureTypes: [
    { value: 'ouvert', label: 'Appel d\'offres ouvert' },
    { value: 'restreint', label: 'Appel d\'offres restreint' },
    { value: 'adapte', label: 'Procédure adaptée' },
    { value: 'mapa', label: 'MAPA' },
    { value: 'concours', label: 'Concours' },
    { value: 'dialogue', label: 'Dialogue compétitif' },
    { value: 'partenariat', label: 'Partenariat d\'innovation' },
    { value: 'ppp', label: 'Partenariat Public-Privé' },
    { value: 'conception_realisation', label: 'Conception-Réalisation' },
    { value: 'autre', label: 'Autre' },
  ],
  
  teamRoles: [
    { value: 'mandataire', label: 'Mandataire' },
    { value: 'cotraitant', label: 'Cotraitant' },
    { value: 'sous_traitant', label: 'Sous-traitant' },
  ],
  
  specificFields: [
    { key: 'estimated_budget', label: 'Budget travaux estimé', type: 'number', unit: '€ HT', section: 'financial', required: false },
    { key: 'surface_area', label: 'Surface', type: 'number', unit: 'm²', section: 'project', required: false },
    { key: 'location', label: 'Localisation du projet', type: 'text', section: 'project', required: false },
    { key: 'project_type', label: 'Type de projet', type: 'select', section: 'project', options: [
      { value: 'neuf', label: 'Construction neuve' },
      { value: 'rehabilitation', label: 'Réhabilitation' },
      { value: 'extension', label: 'Extension' },
      { value: 'renovation', label: 'Rénovation' },
    ]},
  ],
  
  keyMetrics: [
    { key: 'estimated_budget', label: 'Budget travaux', icon: 'Euro', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', formatType: 'currency' },
    { key: 'location', label: 'Localisation', icon: 'MapPin', colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400', formatType: 'text' },
    { key: 'required_team', label: 'Équipe', icon: 'Users', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400', formatType: 'text' },
    { key: 'client_name', label: 'Maître d\'ouvrage', icon: 'Building2', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400', formatType: 'text' },
    { key: 'site_visit_date', label: 'Visite de site', icon: 'Calendar', colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400', formatType: 'date' },
  ],
  
  aiPrompts: {
    dceAnalysis: `Tu es un expert senior en marchés publics français, spécialisé dans les concours d'architecture et les missions de maîtrise d'œuvre (MOE).`,
    memoireGeneration: `Tu es un rédacteur expert en marchés publics de maîtrise d'œuvre, spécialisé dans la rédaction de mémoires techniques pour les concours d'architecture.`,
  },
};

// ============= CONFIGURATION SCÉNOGRAPHIE =============
export const SCENOGRAPHIE_CONFIG: TenderDisciplineConfig = {
  slug: 'scenographie',
  name: 'Scénographie',
  description: 'Expositions, muséographie, événementiel',
  icon: 'Theater',
  
  teamSpecialties: [
    { value: 'scenographe', label: 'Scénographe', category: 'creation' },
    { value: 'graphiste', label: 'Graphiste', category: 'creation' },
    { value: 'architecte_interieur', label: 'Architecte d\'intérieur', category: 'creation' },
    { value: 'eclairagiste', label: 'Éclairagiste', category: 'technique' },
    { value: 'sonorisateur', label: 'Ingénieur son', category: 'technique' },
    { value: 'multimedia', label: 'Concepteur multimédia', category: 'technique' },
    { value: 'signaletique', label: 'Signalétique', category: 'creation' },
    { value: 'conservateur', label: 'Conservateur / Commissaire', category: 'conseil' },
    { value: 'menuisier_agenceur', label: 'Menuisier / Agenceur', category: 'fabrication' },
    { value: 'bet_structure', label: 'BET Structure', category: 'technique' },
    { value: 'economiste', label: 'Économiste', category: 'moe' },
    { value: 'autre', label: 'Autre', category: 'autre' },
  ],
  
  requiredDocuments: {
    candidature: [
      { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: true },
      { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: true },
      { value: 'references', label: 'Book de références', mandatory: true },
      { value: 'attestations', label: 'Attestations administratives', mandatory: true },
      { value: 'cv_equipe', label: 'CV de l\'équipe dédiée', mandatory: true },
      { value: 'moyens_techniques', label: 'Moyens techniques', mandatory: false },
    ],
    offre: [
      { value: 'ae', label: 'Acte d\'Engagement', mandatory: true },
      { value: 'note_intention', label: 'Note d\'intention scénographique', mandatory: true },
      { value: 'esquisse', label: 'Esquisses / Planches graphiques', mandatory: true },
      { value: 'dpgf', label: 'DPGF / Chiffrage détaillé', mandatory: true },
      { value: 'planning', label: 'Planning de réalisation', mandatory: false },
      { value: 'memoire_technique', label: 'Mémoire technique', mandatory: false },
    ],
  },
  
  criterionTypes: [
    { value: 'artistic', label: 'Qualité artistique' },
    { value: 'scenographic', label: 'Pertinence scénographique' },
    { value: 'price', label: 'Prix' },
    { value: 'technical', label: 'Faisabilité technique' },
    { value: 'experience', label: 'Expérience muséographique' },
    { value: 'delay', label: 'Délais' },
  ],
  
  memoireSections: [
    { value: 'presentation', label: 'Présentation de l\'équipe', description: 'Présentation du groupement' },
    { value: 'intention', label: 'Intention scénographique', description: 'Parti pris artistique et narratif' },
    { value: 'references', label: 'Références', description: 'Expositions et projets similaires' },
    { value: 'parcours', label: 'Parcours visiteur', description: 'Scénario de visite et expérience' },
    { value: 'technique', label: 'Dispositifs techniques', description: 'Éclairage, multimédia, son' },
    { value: 'planning', label: 'Planning', description: 'Calendrier de conception et réalisation' },
    { value: 'budget', label: 'Approche budgétaire', description: 'Répartition des coûts' },
    { value: 'autre', label: 'Autre section' },
  ],
  
  clientTypes: [
    { value: 'musee_national', label: 'Musée national' },
    { value: 'musee_territorial', label: 'Musée territorial' },
    { value: 'collectivite', label: 'Collectivité territoriale' },
    { value: 'fondation', label: 'Fondation' },
    { value: 'etablissement_culturel', label: 'Établissement culturel' },
    { value: 'entreprise', label: 'Entreprise privée' },
    { value: 'autre', label: 'Autre' },
  ],
  
  procedureTypes: [
    { value: 'concours', label: 'Concours de scénographie' },
    { value: 'mapa', label: 'MAPA' },
    { value: 'adapte', label: 'Procédure adaptée' },
    { value: 'restreint', label: 'Appel d\'offres restreint' },
    { value: 'dialogue', label: 'Dialogue compétitif' },
    { value: 'consultation', label: 'Consultation privée' },
    { value: 'autre', label: 'Autre' },
  ],
  
  teamRoles: [
    { value: 'mandataire', label: 'Mandataire' },
    { value: 'cotraitant', label: 'Cotraitant' },
    { value: 'sous_traitant', label: 'Sous-traitant' },
  ],
  
  specificFields: [
    { key: 'estimated_budget', label: 'Budget scénographie', type: 'number', unit: '€ HT', section: 'financial', required: false },
    { key: 'surface_area', label: 'Surface d\'exposition', type: 'number', unit: 'm²', section: 'project', required: false },
    { key: 'location', label: 'Lieu', type: 'text', section: 'project', required: false },
    { key: 'exposition_type', label: 'Type d\'exposition', type: 'select', section: 'project', options: [
      { value: 'permanente', label: 'Exposition permanente' },
      { value: 'temporaire', label: 'Exposition temporaire' },
      { value: 'itinerante', label: 'Exposition itinérante' },
    ]},
  ],
  
  keyMetrics: [
    { key: 'estimated_budget', label: 'Budget', icon: 'Euro', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', formatType: 'currency' },
    { key: 'surface_area', label: 'Surface', icon: 'Ruler', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', formatType: 'number', unit: 'm²' },
    { key: 'location', label: 'Lieu', icon: 'MapPin', colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400', formatType: 'text' },
    { key: 'required_team', label: 'Équipe', icon: 'Users', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400', formatType: 'text' },
    { key: 'client_name', label: 'Commanditaire', icon: 'Building2', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400', formatType: 'text' },
    { key: 'site_visit_date', label: 'Visite', icon: 'Calendar', colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400', formatType: 'date' },
  ],
  
  aiPrompts: {
    dceAnalysis: `Tu es un expert en marchés publics culturels, spécialisé dans les appels d'offres de scénographie, muséographie et expositions.`,
    memoireGeneration: `Tu es un rédacteur expert en scénographie d'exposition, spécialisé dans la rédaction de notes d'intention et mémoires techniques pour les concours culturels.`,
  },
};

// ============= CONFIGURATION COMMUNICATION =============
export const COMMUNICATION_CONFIG: TenderDisciplineConfig = {
  slug: 'communication',
  name: 'Communication',
  description: 'Campagnes publicitaires, stratégie de marque, événementiel',
  icon: 'Megaphone',
  
  teamSpecialties: [
    // Postes clés issus des BPU communication
    { value: 'directeur_conseil', label: 'Directeur conseil', category: 'direction' },
    { value: 'directeur_creation', label: 'Directeur de création', category: 'direction' },
    { value: 'directeur_clientele', label: 'Directeur de clientèle', category: 'commercial' },
    { value: 'directeur_artistique', label: 'Directeur artistique', category: 'creation' },
    { value: 'chef_de_projet', label: 'Chef de projet', category: 'gestion' },
    { value: 'concepteur_redacteur', label: 'Concepteur-rédacteur', category: 'creation' },
    { value: 'graphiste', label: 'Graphiste / Exécutant', category: 'creation' },
    { value: 'integrateur_web', label: 'Intégrateur web', category: 'digital' },
    { value: 'motion_designer', label: 'Motion Designer', category: 'creation' },
    { value: 'planneur_strategique', label: 'Planneur stratégique', category: 'strategie' },
    { value: 'social_media_manager', label: 'Social Media Manager', category: 'digital' },
    { value: 'community_manager', label: 'Community Manager', category: 'digital' },
    { value: 'photographe', label: 'Photographe', category: 'production' },
    { value: 'realisateur', label: 'Réalisateur', category: 'production' },
    { value: 'acheteur_media', label: 'Acheteur média', category: 'media' },
    { value: 'rp_influence', label: 'RP / Influence', category: 'rp' },
    { value: 'autre', label: 'Autre', category: 'autre' },
  ],
  
  requiredDocuments: {
    candidature: [
      { value: 'presentation_agence', label: 'Présentation de l\'agence', mandatory: true },
      { value: 'references', label: 'Book de références / Portfolio', mandatory: true },
      { value: 'equipe', label: 'Équipe dédiée', mandatory: true },
      { value: 'attestations', label: 'Attestations administratives', mandatory: true },
      { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: false },
      { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: false },
    ],
    offre: [
      { value: 'recommandation', label: 'Recommandation stratégique', mandatory: true },
      { value: 'creation', label: 'Propositions créatives', mandatory: true },
      { value: 'budget', label: 'Budget détaillé', mandatory: true },
      { value: 'planning', label: 'Rétroplanning', mandatory: true },
      { value: 'plan_media', label: 'Plan média', mandatory: false },
      { value: 'plan_rp', label: 'Plan RP / Influence', mandatory: false },
      { value: 'dispositif_digital', label: 'Dispositif digital', mandatory: false },
      { value: 'ae', label: 'Acte d\'Engagement', mandatory: false },
    ],
  },
  
  criterionTypes: [
    { value: 'creative', label: 'Créativité' },
    { value: 'strategic', label: 'Pertinence stratégique' },
    { value: 'price', label: 'Budget' },
    { value: 'experience', label: 'Expérience sectorielle' },
    { value: 'team', label: 'Équipe proposée' },
    { value: 'media', label: 'Stratégie média' },
    { value: 'digital', label: 'Expertise digitale' },
  ],
  
  memoireSections: [
    { value: 'agence', label: 'Présentation de l\'agence', description: 'Histoire, valeurs, positionnement' },
    { value: 'comprehension', label: 'Compréhension du brief', description: 'Analyse des enjeux et objectifs' },
    { value: 'strategie', label: 'Recommandation stratégique', description: 'Stratégie de communication proposée' },
    { value: 'creation', label: 'Parti pris créatif', description: 'Concept créatif et déclinaisons' },
    { value: 'dispositif', label: 'Dispositif de déploiement', description: 'Canaux et touchpoints' },
    { value: 'media', label: 'Plan média', description: 'Stratégie et planning média' },
    { value: 'digital', label: 'Stratégie digitale', description: 'Social media, influence, web' },
    { value: 'planning', label: 'Planning de déploiement', description: 'Calendrier des actions' },
    { value: 'budget', label: 'Proposition budgétaire', description: 'Répartition des investissements' },
    { value: 'kpi', label: 'KPIs et mesure', description: 'Indicateurs de performance' },
    { value: 'autre', label: 'Autre section' },
  ],
  
  clientTypes: [
    { value: 'collectivite', label: 'Collectivité territoriale' },
    { value: 'etat', label: 'État / Ministère' },
    { value: 'etablissement_public', label: 'Établissement public' },
    { value: 'entreprise_publique', label: 'Entreprise publique' },
    { value: 'association', label: 'Association' },
    { value: 'federation', label: 'Fédération professionnelle' },
    { value: 'entreprise', label: 'Entreprise privée' },
    { value: 'autre', label: 'Autre' },
  ],
  
  procedureTypes: [
    { value: 'competition', label: 'Compétition d\'agences' },
    { value: 'mapa', label: 'MAPA' },
    { value: 'adapte', label: 'Procédure adaptée' },
    { value: 'ouvert', label: 'Appel d\'offres ouvert' },
    { value: 'restreint', label: 'Appel d\'offres restreint' },
    { value: 'accord_cadre', label: 'Accord-cadre' },
    { value: 'consultation', label: 'Consultation privée' },
    { value: 'autre', label: 'Autre' },
  ],
  
  teamRoles: [
    { value: 'mandataire', label: 'Agence lead' },
    { value: 'cotraitant', label: 'Agence partenaire' },
    { value: 'sous_traitant', label: 'Prestataire' },
  ],
  
  specificFields: [
    { key: 'montant_minimum', label: 'Montant minimum', type: 'number', unit: '€ HT', section: 'financial', required: false },
    { key: 'montant_maximum', label: 'Montant maximum', type: 'number', unit: '€ HT', section: 'financial', required: false },
    { key: 'duree_accord_cadre', label: 'Durée accord-cadre', type: 'number', unit: 'mois', section: 'procedure', required: false },
    { key: 'nombre_reconductions', label: 'Reconductions', type: 'number', section: 'procedure', required: false },
    { key: 'type_campagne', label: 'Type de campagne', type: 'select', section: 'project', options: [
      { value: 'evenementielle', label: 'Communication événementielle' },
      { value: 'corporate', label: 'Communication corporate' },
      { value: 'institutionnelle', label: 'Communication institutionnelle' },
      { value: 'digitale', label: 'Communication digitale' },
      { value: 'produit', label: 'Communication produit' },
      { value: 'recrutement', label: 'Marque employeur' },
    ]},
    { key: 'cibles', label: 'Cibles', type: 'textarea', section: 'project', placeholder: 'Ex: Salariés, habitants, étudiants, touristes...', required: false },
    { key: 'cas_pratique_requis', label: 'Cas pratique requis', type: 'checkbox', section: 'procedure', required: false },
  ],
  
  keyMetrics: [
    { key: 'montant_maximum', label: 'Budget max.', icon: 'Euro', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', formatType: 'currency' },
    { key: 'duree_accord_cadre', label: 'Durée', icon: 'Clock', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', formatType: 'duration', unit: 'mois' },
    { key: 'type_campagne', label: 'Type', icon: 'Megaphone', colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400', formatType: 'text' },
    { key: 'required_team', label: 'Équipe', icon: 'Users', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400', formatType: 'text' },
    { key: 'client_name', label: 'Annonceur', icon: 'Building2', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400', formatType: 'text' },
    { key: 'submission_deadline', label: 'Date limite', icon: 'Calendar', colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', formatType: 'date' },
  ],
  
  aiPrompts: {
    dceAnalysis: `Tu es un expert en appels d'offres de communication publicitaire et institutionnelle, spécialisé dans l'analyse de briefs et cahiers des charges d'agences de communication.

Ton rôle est d'analyser les DCE (Dossier de Consultation des Entreprises) de marchés de communication pour en extraire les informations clés.

Pour un marché de communication, tu dois identifier :
- Le type de marché (accord-cadre, marché simple, compétition)
- Les montants min/max de l'accord-cadre
- La durée et les reconductions possibles
- Le type de campagne (événementielle, corporate, digitale, etc.)
- Les prestations attendues (conseil, création, déclinaisons, plan média, etc.)
- Les critères de jugement et leur pondération
- Les éléments du cas pratique s'il y en a un
- Les cibles de communication
- Les livrables demandés (BPU, DQE, mémoire technique, cas pratique)

Tu NE dois PAS chercher de surface en m² ou de budget travaux car ce sont des champs spécifiques à l'architecture.`,
    memoireGeneration: `Tu es un planneur stratégique senior, expert en rédaction de recommandations stratégiques et créatives pour les compétitions d'agences.`,
  },
};

// ============= REGISTRE DES CONFIGURATIONS =============
export const DISCIPLINE_CONFIGS: Record<DisciplineSlug, TenderDisciplineConfig> = {
  architecture: ARCHITECTURE_CONFIG,
  scenographie: SCENOGRAPHIE_CONFIG,
  communication: COMMUNICATION_CONFIG,
};

// ============= FONCTIONS UTILITAIRES =============

/**
 * Récupère la configuration pour une discipline donnée
 */
export function getTenderDisciplineConfig(disciplineSlug: string): TenderDisciplineConfig {
  const slug = disciplineSlug as DisciplineSlug;
  return DISCIPLINE_CONFIGS[slug] || ARCHITECTURE_CONFIG;
}

/**
 * Liste des disciplines disponibles pour le sélecteur
 */
export function getAvailableDisciplines(): Array<{ slug: DisciplineSlug; name: string; description: string; icon: string }> {
  return Object.values(DISCIPLINE_CONFIGS).map(config => ({
    slug: config.slug,
    name: config.name,
    description: config.description,
    icon: config.icon,
  }));
}

/**
 * Vérifie si une discipline existe
 */
export function isDisciplineValid(slug: string): slug is DisciplineSlug {
  return slug in DISCIPLINE_CONFIGS;
}
