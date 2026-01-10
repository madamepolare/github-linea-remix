import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Check, Building2, Palette, Globe, Megaphone, Camera, PartyPopper, Lightbulb } from "lucide-react";
import { useDocumentationCategories, useDocumentationPages } from "@/hooks/useDocumentation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DISCIPLINES = [
  {
    id: "communication",
    name: "Agence de communication",
    description: "Stratégie de marque, création de contenu, relations presse",
    icon: Megaphone,
    color: "bg-info/10 text-info",
  },
  {
    id: "branding",
    name: "Agence de branding",
    description: "Identité visuelle, naming, plateforme de marque",
    icon: Palette,
    color: "bg-accent/10 text-accent",
  },
  {
    id: "design",
    name: "Studio de design",
    description: "UX/UI design, design graphique, direction artistique",
    icon: Lightbulb,
    color: "bg-warning/10 text-warning",
  },
  {
    id: "web",
    name: "Agence web / App",
    description: "Sites internet, applications mobiles, développement",
    icon: Globe,
    color: "bg-success/10 text-success",
  },
  {
    id: "architecture",
    name: "Architecture / Design intérieur",
    description: "Projets architecturaux, aménagement, décoration",
    icon: Building2,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "marketing",
    name: "Marketing / Social media",
    description: "Stratégie digitale, community management, SEO/SEA",
    icon: Camera,
    color: "bg-destructive/10 text-destructive",
  },
  {
    id: "event",
    name: "Événementiel / Production",
    description: "Événements, production audiovisuelle, activation",
    icon: PartyPopper,
    color: "bg-info/10 text-info",
  },
];

interface AISetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISetupDialog({ open, onOpenChange }: AISetupDialogProps) {
  const [step, setStep] = useState<"select" | "generating" | "complete">("select");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState({ categories: 0, pages: 0 });
  
  const { createCategory } = useDocumentationCategories();
  const { createPage } = useDocumentationPages();

  const handleGenerate = async () => {
    if (!selectedDiscipline) return;

    setStep("generating");
    setProgress(0);

    try {
      // Generate categories and pages based on discipline
      const result = await generateDocumentationForDiscipline(selectedDiscipline);
      
      setGeneratedCount(result);
      setStep("complete");
      toast.success("Documentation générée avec succès !");
    } catch (error) {
      console.error("Error generating documentation:", error);
      toast.error("Erreur lors de la génération");
      setStep("select");
    }
  };

  const generateDocumentationForDiscipline = async (discipline: string) => {
    // Pre-defined structure for each discipline
    const structures = getDocumentationStructure(discipline);
    
    let categoriesCreated = 0;
    let pagesCreated = 0;
    const categoryMap: Record<string, string> = {};

    // Create categories
    for (let i = 0; i < structures.categories.length; i++) {
      const cat = structures.categories[i];
      setProgress((i / (structures.categories.length + structures.pages.length)) * 100);
      
      try {
        const result = await createCategory.mutateAsync({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          color: cat.color,
          sort_order: i,
        });
        categoryMap[cat.slug] = result.id;
        categoriesCreated++;
      } catch (e) {
        console.error("Error creating category:", e);
      }
    }

    // Create pages
    for (let i = 0; i < structures.pages.length; i++) {
      const page = structures.pages[i];
      setProgress(((structures.categories.length + i) / (structures.categories.length + structures.pages.length)) * 100);
      
      try {
        await createPage.mutateAsync({
          title: page.title,
          slug: page.slug,
          emoji: page.emoji,
          objective: page.objective,
          context: page.context,
          content: page.content,
          steps: page.steps,
          checklist: page.checklist,
          tips: page.tips,
          tags: page.tags,
          page_type: page.page_type,
          category_id: page.category_slug ? categoryMap[page.category_slug] : undefined,
        });
        pagesCreated++;
      } catch (e) {
        console.error("Error creating page:", e);
      }
    }

    setProgress(100);
    return { categories: categoriesCreated, pages: pagesCreated };
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("select");
      setSelectedDiscipline("");
      setProgress(0);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Générer votre documentation
                </DialogTitle>
                <DialogDescription>
                  Sélectionnez la discipline principale de votre agence. L'IA va générer une documentation complète adaptée à votre métier.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6">
                <RadioGroup
                  value={selectedDiscipline}
                  onValueChange={setSelectedDiscipline}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {DISCIPLINES.map((discipline) => (
                    <Label
                      key={discipline.id}
                      htmlFor={discipline.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all",
                        selectedDiscipline === discipline.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <RadioGroupItem value={discipline.id} id={discipline.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("p-1.5 rounded-md", discipline.color)}>
                            <discipline.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-sm">{discipline.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{discipline.description}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button onClick={handleGenerate} disabled={!selectedDiscipline}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer la documentation
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-12 text-center"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2">Génération en cours...</h3>
              <p className="text-muted-foreground mb-6">
                L'IA prépare votre documentation personnalisée
              </p>
              <Progress value={progress} className="w-64 mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}%</p>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 text-center"
            >
              <div className="rounded-full bg-success/10 p-4 w-fit mx-auto mb-6">
                <Check className="h-12 w-12 text-success" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Documentation générée !</h3>
              <p className="text-muted-foreground mb-6">
                {generatedCount.categories} catégories et {generatedCount.pages} pages ont été créées.
              </p>
              <Button onClick={handleClose}>
                Découvrir ma documentation
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get documentation structure for each discipline
function getDocumentationStructure(discipline: string) {
  // Base categories common to all disciplines
  const baseCategories = [
    { name: "Vie d'agence", slug: "agency-life", description: "Protocoles internes et vie quotidienne", icon: "agency", color: "primary" },
    { name: "Workflows projet", slug: "project-workflows", description: "Processus pour chaque type de projet", icon: "projects", color: "info" },
    { name: "Rôles & responsabilités", slug: "roles", description: "Fiches de poste et responsabilités", icon: "roles", color: "success" },
    { name: "Checklists", slug: "checklists", description: "Listes de contrôle actionnables", icon: "checklists", color: "warning" },
    { name: "Outils & ressources", slug: "tools", description: "Guide des outils utilisés", icon: "tools", color: "accent" },
  ];

  // Base pages common to all disciplines
  const basePages = [
    {
      title: "Onboarding nouveau collaborateur",
      slug: "onboarding-new-hire",
      emoji: "👋",
      category_slug: "agency-life",
      objective: "Accueillir et intégrer un nouveau collaborateur de manière structurée",
      context: "Premier jour et première semaine d'un nouveau membre de l'équipe",
      content: "Ce document guide l'intégration d'un nouveau collaborateur dans l'agence. Il couvre les aspects administratifs, techniques et humains pour une prise de poste réussie.",
      steps: [
        { id: "1", title: "Préparation avant l'arrivée", description: "Préparer le poste de travail, accès aux outils, badge, etc." },
        { id: "2", title: "Accueil jour J", description: "Tour de l'agence, présentation de l'équipe, remise du welcome pack" },
        { id: "3", title: "Configuration des outils", description: "Création des comptes, accès aux projets en cours" },
        { id: "4", title: "Rencontres clés", description: "Réunions avec les différents pôles et responsables" },
        { id: "5", title: "Bilan de fin de semaine", description: "Point avec le manager sur les premières impressions" },
      ],
      checklist: [
        { id: "c1", label: "Poste de travail prêt", checked: false },
        { id: "c2", label: "Accès email configuré", checked: false },
        { id: "c3", label: "Accès Slack/Teams créé", checked: false },
        { id: "c4", label: "Badge d'accès remis", checked: false },
        { id: "c5", label: "Welcome pack remis", checked: false },
        { id: "c6", label: "Présentation à l'équipe faite", checked: false },
      ],
      tips: "💡 Astuce : Préparez un buddy/parrain pour accompagner le nouveau collaborateur durant ses premières semaines.",
      tags: ["onboarding", "mandatory"],
      page_type: "workflow",
    },
    {
      title: "Routines quotidiennes",
      slug: "daily-routines",
      emoji: "☀️",
      category_slug: "agency-life",
      objective: "Structurer les rituels quotidiens de l'équipe",
      context: "Organisation du travail au jour le jour",
      content: "Les routines quotidiennes permettent de synchroniser l'équipe et d'assurer un suivi régulier des projets.",
      steps: [
        { id: "1", title: "Morning standup", description: "Réunion quotidienne de 15min max pour partager les priorités" },
        { id: "2", title: "Deep work time", description: "Plages horaires protégées pour le travail de fond" },
        { id: "3", title: "Check-in projets", description: "Point rapide sur l'avancement des livrables" },
      ],
      checklist: [
        { id: "c1", label: "Standup réalisé", checked: false },
        { id: "c2", label: "Tâches du jour priorisées", checked: false },
        { id: "c3", label: "Blocages remontés", checked: false },
      ],
      tips: "💡 Le standup ne doit pas dépasser 15 minutes. Chacun répond à : Qu'ai-je fait ? Que vais-je faire ? Ai-je des blocages ?",
      tags: ["internal", "best-practice"],
      page_type: "standard",
    },
    {
      title: "Communication interne",
      slug: "internal-communication",
      emoji: "💬",
      category_slug: "agency-life",
      objective: "Définir les règles de communication au sein de l'équipe",
      context: "Utilisation des outils de communication et bonnes pratiques",
      content: "Une bonne communication interne est essentielle pour la collaboration et la productivité de l'équipe.",
      steps: [
        { id: "1", title: "Choix du canal", description: "Slack pour l'instantané, email pour le formel, réunion pour le complexe" },
        { id: "2", title: "Réactivité attendue", description: "Slack : dans l'heure, Email : dans la journée" },
        { id: "3", title: "Escalade", description: "Si pas de réponse après X temps, escalader au manager" },
      ],
      checklist: [],
      tips: "💡 Privilégiez les canaux asynchrones pour respecter le temps de concentration de chacun.",
      tags: ["internal"],
      page_type: "standard",
    },
    {
      title: "Checklist lancement de projet",
      slug: "project-kickoff-checklist",
      emoji: "🚀",
      category_slug: "checklists",
      objective: "S'assurer que tous les éléments sont réunis pour bien démarrer un projet",
      context: "Avant le kick-off officiel avec le client",
      content: "Cette checklist garantit un démarrage de projet dans les meilleures conditions.",
      steps: [],
      checklist: [
        { id: "c1", label: "Brief client validé et documenté", checked: false },
        { id: "c2", label: "Équipe projet définie", checked: false },
        { id: "c3", label: "Planning préliminaire établi", checked: false },
        { id: "c4", label: "Budget validé", checked: false },
        { id: "c5", label: "Dossier projet créé (drive, notion, etc.)", checked: false },
        { id: "c6", label: "Réunion de kick-off planifiée", checked: false },
        { id: "c7", label: "Accès partagés avec le client", checked: false },
      ],
      tips: "💡 Ne démarrez jamais un projet sans brief validé par écrit.",
      tags: ["mandatory", "client"],
      page_type: "checklist",
    },
    {
      title: "Validation des livrables",
      slug: "deliverable-validation",
      emoji: "✅",
      category_slug: "checklists",
      objective: "Garantir la qualité avant envoi au client",
      context: "Avant chaque livraison importante",
      content: "Tout livrable doit passer par cette validation avant d'être envoyé au client.",
      steps: [],
      checklist: [
        { id: "c1", label: "Relecture orthographique faite", checked: false },
        { id: "c2", label: "Vérification des formats", checked: false },
        { id: "c3", label: "Test sur différents devices", checked: false },
        { id: "c4", label: "Validation technique interne", checked: false },
        { id: "c5", label: "Validation DA/Directeur créa", checked: false },
        { id: "c6", label: "Nommage des fichiers correct", checked: false },
      ],
      tips: "💡 Faites toujours valider par quelqu'un qui n'a pas travaillé sur le projet.",
      tags: ["mandatory", "client", "best-practice"],
      page_type: "checklist",
    },
    {
      title: "Clôture de projet",
      slug: "project-closure",
      emoji: "🎬",
      category_slug: "checklists",
      objective: "Clôturer proprement un projet pour capitaliser et archiver",
      context: "Après la livraison finale et le paiement",
      content: "Une bonne clôture permet de capitaliser sur le projet et de libérer les ressources.",
      steps: [],
      checklist: [
        { id: "c1", label: "Facture finale envoyée", checked: false },
        { id: "c2", label: "Paiement reçu", checked: false },
        { id: "c3", label: "Rétrospective d'équipe réalisée", checked: false },
        { id: "c4", label: "Fichiers sources archivés", checked: false },
        { id: "c5", label: "Case study / référence créée", checked: false },
        { id: "c6", label: "Témoignage client demandé", checked: false },
        { id: "c7", label: "Projet passé en statut clos", checked: false },
      ],
      tips: "💡 La rétrospective est le meilleur moyen de progresser : qu'est-ce qui a bien marché ? Que peut-on améliorer ?",
      tags: ["internal", "best-practice"],
      page_type: "checklist",
    },
    {
      title: "Fiche de poste : Chef de projet",
      slug: "role-project-manager",
      emoji: "👩‍💼",
      category_slug: "roles",
      objective: "Définir les responsabilités du chef de projet",
      context: "Référentiel du rôle de chef de projet",
      content: "Le chef de projet est le garant du bon déroulement des projets, de la relation client et du respect des délais et budgets.",
      steps: [],
      checklist: [
        { id: "c1", label: "Brief client complet", checked: false },
        { id: "c2", label: "Planning à jour", checked: false },
        { id: "c3", label: "Point client hebdomadaire", checked: false },
        { id: "c4", label: "Suivi budget régulier", checked: false },
        { id: "c5", label: "CR de réunion envoyé sous 24h", checked: false },
      ],
      tips: "💡 Un bon chef de projet anticipe les problèmes avant qu'ils n'arrivent.",
      tags: ["internal"],
      page_type: "role",
    },
  ];

  // Discipline-specific pages
  const disciplinePages: Record<string, typeof basePages> = {
    communication: [
      {
        title: "Workflow : Stratégie de communication",
        slug: "workflow-com-strategy",
        emoji: "📢",
        category_slug: "project-workflows",
        objective: "Structurer la création d'une stratégie de communication",
        context: "Projet de définition stratégique pour un client",
        content: "La stratégie de communication définit le positionnement, les messages clés et les canaux pour atteindre les objectifs du client.",
        steps: [
          { id: "1", title: "Audit de l'existant", description: "Analyse de la communication actuelle et benchmark concurrentiel" },
          { id: "2", title: "Définition des objectifs", description: "KPIs, cibles, messages clés" },
          { id: "3", title: "Stratégie créative", description: "Concept, tone of voice, univers graphique" },
          { id: "4", title: "Plan de déploiement", description: "Canaux, planning, budget média" },
          { id: "5", title: "Présentation client", description: "Deck stratégique et recommandations" },
        ],
        checklist: [],
        tips: "💡 Toujours partir des insights consommateurs pour construire la stratégie.",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
    branding: [
      {
        title: "Workflow : Création d'identité visuelle",
        slug: "workflow-visual-identity",
        emoji: "🎨",
        category_slug: "project-workflows",
        objective: "Structurer la création d'une identité de marque",
        context: "Projet de branding complet",
        content: "L'identité visuelle est l'expression graphique de la marque. Elle doit être cohérente, distinctive et mémorable.",
        steps: [
          { id: "1", title: "Brief et audit", description: "Compréhension de la marque, valeurs, positionnement" },
          { id: "2", title: "Recherches créatives", description: "Moodboards, benchmarks, pistes exploratoires" },
          { id: "3", title: "Création du logo", description: "Propositions, variations, construction" },
          { id: "4", title: "Système graphique", description: "Couleurs, typographies, éléments graphiques" },
          { id: "5", title: "Charte graphique", description: "Document de référence complet" },
          { id: "6", title: "Déclinaisons", description: "Applications sur différents supports" },
        ],
        checklist: [],
        tips: "💡 Un bon logo doit fonctionner en noir et blanc avant d'ajouter la couleur.",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
    design: [
      {
        title: "Workflow : UX/UI Design",
        slug: "workflow-ux-ui",
        emoji: "💻",
        category_slug: "project-workflows",
        objective: "Structurer un projet de design d'interface",
        context: "Projet de conception d'interface utilisateur",
        content: "Le design UX/UI combine ergonomie et esthétique pour créer des interfaces efficaces et agréables.",
        steps: [
          { id: "1", title: "Research", description: "Analyse utilisateurs, personas, parcours" },
          { id: "2", title: "Architecture", description: "Arborescence, user flows" },
          { id: "3", title: "Wireframes", description: "Maquettes fil de fer, tests rapides" },
          { id: "4", title: "UI Design", description: "Maquettes haute-fidélité, design system" },
          { id: "5", title: "Prototype", description: "Prototype interactif pour tests" },
          { id: "6", title: "Handoff", description: "Spécifications pour les développeurs" },
        ],
        checklist: [],
        tips: "💡 Testez toujours vos wireframes avant de passer à l'UI pour valider les parcours.",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
    web: [
      {
        title: "Workflow : Création de site web",
        slug: "workflow-website",
        emoji: "🌐",
        category_slug: "project-workflows",
        objective: "Structurer un projet de création de site internet",
        context: "Projet de site vitrine ou e-commerce",
        content: "Un projet web réussi nécessite une méthodologie rigoureuse de la conception au déploiement.",
        steps: [
          { id: "1", title: "Cadrage", description: "Brief, objectifs, contenus, fonctionnalités" },
          { id: "2", title: "UX Design", description: "Arborescence, wireframes, parcours" },
          { id: "3", title: "UI Design", description: "Maquettes, responsive, animations" },
          { id: "4", title: "Développement", description: "Intégration, développement back" },
          { id: "5", title: "Contenus", description: "Rédaction, médias, SEO" },
          { id: "6", title: "Tests", description: "QA, cross-browser, performance" },
          { id: "7", title: "Mise en ligne", description: "Déploiement, formation, maintenance" },
        ],
        checklist: [],
        tips: "💡 Prévoyez toujours 20% du temps projet pour les tests et corrections.",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
    architecture: [
      {
        title: "Workflow : Projet architectural",
        slug: "workflow-architecture",
        emoji: "🏛️",
        category_slug: "project-workflows",
        objective: "Structurer les phases d'un projet d'architecture",
        context: "Projet de construction ou rénovation",
        content: "Un projet architectural suit des phases normées de l'esquisse à la réception des travaux.",
        steps: [
          { id: "1", title: "ESQ - Esquisse", description: "Premières intentions, volumétrie générale" },
          { id: "2", title: "APS - Avant-projet sommaire", description: "Plans, coupes, estimations" },
          { id: "3", title: "APD - Avant-projet définitif", description: "Plans détaillés, matériaux" },
          { id: "4", title: "PRO - Projet", description: "Dossier technique complet" },
          { id: "5", title: "DCE - Consultation entreprises", description: "Appel d'offres, analyse" },
          { id: "6", title: "DET - Direction de chantier", description: "Suivi travaux, réceptions" },
        ],
        checklist: [],
        tips: "💡 Documentez chaque décision client pour éviter les litiges en phase chantier.",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
    marketing: [
      {
        title: "Workflow : Campagne Social Media",
        slug: "workflow-social-campaign",
        emoji: "📱",
        category_slug: "project-workflows",
        objective: "Structurer une campagne sur les réseaux sociaux",
        context: "Activation digitale sur les réseaux",
        content: "Une campagne social media efficace combine créativité, ciblage précis et analyse des performances.",
        steps: [
          { id: "1", title: "Stratégie", description: "Objectifs, KPIs, cibles, canaux" },
          { id: "2", title: "Création", description: "Concepts, formats, copy" },
          { id: "3", title: "Production", description: "Shootings, vidéos, motion" },
          { id: "4", title: "Médiatisation", description: "Setup publicitaire, ciblage" },
          { id: "5", title: "Animation", description: "Community management, interactions" },
          { id: "6", title: "Reporting", description: "Analyse, optimisation, bilan" },
        ],
        checklist: [],
        tips: "💡 Prévoyez plusieurs itérations créatives pour optimiser les performances.",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
    event: [
      {
        title: "Workflow : Organisation d'événement",
        slug: "workflow-event",
        emoji: "🎉",
        category_slug: "project-workflows",
        objective: "Structurer l'organisation d'un événement",
        context: "Événement corporate ou grand public",
        content: "L'organisation d'un événement requiert une planification minutieuse et une coordination sans faille.",
        steps: [
          { id: "1", title: "Concept", description: "Brief, thématique, format" },
          { id: "2", title: "Budgétisation", description: "Postes de dépenses, devis prestataires" },
          { id: "3", title: "Logistique", description: "Lieu, technique, restauration" },
          { id: "4", title: "Communication", description: "Invitations, RP, social" },
          { id: "5", title: "Production", description: "Décors, animations, programme" },
          { id: "6", title: "Jour J", description: "Coordination, gestion imprévus" },
          { id: "7", title: "Bilan", description: "Reporting, retours, capitalisation" },
        ],
        checklist: [],
        tips: "💡 Prévoyez toujours un plan B pour les éléments critiques (météo, technique...).",
        tags: ["client"],
        page_type: "workflow",
      },
    ],
  };

  return {
    categories: baseCategories,
    pages: [...basePages, ...(disciplinePages[discipline] || [])],
  };
}
