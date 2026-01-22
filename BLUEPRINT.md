# 🏗️ LINEA SUITE - BLUEPRINT FONCTIONNEL

> Application SaaS de gestion complète pour agences d'architecture, de communication et de scénographie.

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Architecture globale](#architecture-globale)
4. [Modules fonctionnels](#modules-fonctionnels)
5. [Modèle de données](#modèle-de-données)
6. [Système d'authentification & permissions](#système-dauthentification--permissions)
7. [Edge Functions (Backend)](#edge-functions-backend)
8. [Patterns & conventions](#patterns--conventions)
9. [Intégrations externes](#intégrations-externes)

---

## 🎯 VUE D'ENSEMBLE

### Positionnement
Application B2B multi-tenant destinée aux agences créatives (architecture, communication, scénographie). Gère l'intégralité du cycle de vie d'une agence : prospection → projet → facturation.

### Caractéristiques clés
- **Multi-workspace** : Un utilisateur peut appartenir à plusieurs espaces de travail (agences)
- **Multi-discipline** : Configuration dynamique selon le métier (architecture, communication, scénographie)
- **Modulaire** : Modules activables/désactivables par workspace
- **White-label** : Personnalisation visuelle par workspace (logo, couleurs, favicon)
- **Localisé** : Support i18n (FR principal)

### Public cible
- Agences d'architecture (5-50 personnes)
- Agences de communication
- Scénographes d'exposition
- Studios de design

---

## 🔧 STACK TECHNIQUE

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.3 | Framework UI |
| TypeScript | 5.x | Typage statique |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | latest | Composants UI |
| React Router | 6.x | Routing |
| TanStack Query | 5.x | Data fetching & cache |
| Zustand | 5.x | State management (stores légers) |
| Framer Motion | 12.x | Animations |
| React Hook Form + Zod | - | Forms & validation |

### Backend (Lovable Cloud / Supabase)
| Service | Usage |
|---------|-------|
| PostgreSQL | Base de données principale |
| Supabase Auth | Authentification |
| Supabase Storage | Stockage fichiers |
| Edge Functions (Deno) | Logique serveur, IA, PDF |
| Row Level Security | Sécurité données |
| Realtime | Notifications temps réel |

### Intégrations IA
- **Lovable AI** : Gemini 2.5 Pro/Flash, GPT-5 (sans API key utilisateur)
- **Analyse de documents** : Extraction automatique DCE/contrats
- **Génération de contenu** : Mémoires techniques, emails, phases

### Librairies spécialisées
| Lib | Usage |
|-----|-------|
| FullCalendar | Calendrier & planning |
| Recharts | Graphiques & analytics |
| jsPDF + html2canvas | Génération PDF |
| @hello-pangea/dnd | Drag & drop (Kanban) |
| date-fns | Manipulation dates |
| lucide-react | Icônes |

---

## 🏛️ ARCHITECTURE GLOBALE

### Structure des dossiers

```
src/
├── App.tsx                 # Routes & providers
├── main.tsx               # Entry point
├── index.css              # Design tokens (CSS variables)
│
├── components/            # Composants React
│   ├── ui/               # shadcn/ui (Button, Dialog, etc.)
│   ├── layout/           # MainLayout, Sidebar, TopBar
│   ├── auth/             # Login, ProtectedRoute, PermissionGate
│   ├── [module]/         # Composants par module (crm/, projects/, etc.)
│   └── shared/           # Composants réutilisables
│
├── pages/                 # Pages (lazy-loaded)
│   ├── Dashboard.tsx
│   ├── CRM.tsx
│   ├── Projects.tsx
│   └── ...
│
├── hooks/                 # Custom hooks (data fetching, logic)
│   ├── useCRMCompanies.ts
│   ├── useProjects.ts
│   └── ...
│
├── contexts/              # React Contexts
│   ├── AuthContext.tsx   # Auth + profile + workspace
│   ├── TopBarContext.tsx # Navigation state
│   └── TerminologyContext.tsx
│
├── lib/                   # Utilitaires & configuration
│   ├── disciplines/      # Config par discipline
│   ├── navigationConfig.ts
│   ├── permissions.ts
│   └── utils.ts
│
├── types/                 # Types TypeScript
└── integrations/
    └── supabase/
        ├── client.ts     # Client Supabase (auto-généré)
        └── types.ts      # Types DB (auto-généré)

supabase/
├── functions/             # Edge Functions (70+)
│   ├── analyze-dce-before-creation/
│   ├── generate-pdf/
│   └── ...
└── migrations/            # Migrations SQL
```

### Routing

```typescript
// Routes publiques (sans layout)
/                    → Welcome (landing page marketing)
/auth                → Authentification
/q/:token            → Devis public (signature)
/portal/:token       → Portail client

// Routes protégées (avec MainLayout)
/dashboard           → Tableau de bord personnalisable
/crm                 → CRM (contacts, entreprises, prospection)
/crm/companies/:id   → Détail entreprise
/projects            → Gestion projets
/projects/:id        → Détail projet (onglets)
/tasks               → Gestion tâches (Kanban/Liste)
/commercial          → Devis & contrats
/commercial/quote/:id → Éditeur de devis
/tenders             → Appels d'offres
/invoicing           → Facturation
/team                → RH & équipe
/planning            → Planning équipe
/settings            → Paramètres workspace
```

---

## 📦 MODULES FONCTIONNELS

### 1. DASHBOARD
**Fichiers clés:** `pages/Dashboard.tsx`, `components/dashboard/`

| Fonctionnalité | Description |
|----------------|-------------|
| Widgets configurables | Grid personnalisable (react-grid-layout) |
| Templates prédéfinis | Personal, Projects, Finance, Custom |
| Stats temps réel | CA, projets actifs, tâches |
| Activité récente | Feed d'activité workspace |
| Quick actions | Raccourcis contextuels |

**Widgets disponibles:**
- Welcome, Quick Actions, Stats
- Projects Pipeline, Active Projects
- Tasks, Activity Feed
- Revenue Chart, Invoicing Stats
- CRM Stats, Leads Pipeline

---

### 2. CRM
**Fichiers clés:** `pages/CRM.tsx`, `components/crm/`, `hooks/useCRMCompanies.ts`, `hooks/useContacts.ts`, `hooks/useLeads.ts`

#### Entités
| Entité | Table Supabase | Description |
|--------|----------------|-------------|
| Company | `crm_companies` | Entreprises (clients, partenaires, fournisseurs) |
| Contact | `contacts` | Personnes physiques liées aux entreprises |
| Lead | `leads` | Opportunités commerciales |
| Pipeline | `crm_pipelines` + `crm_pipeline_stages` | Pipelines configurables |

#### Fonctionnalités
- **Vue entreprises** : Table avec filtres, tri, recherche SIRET
- **Vue contacts** : Gestion multi-entreprise
- **Prospection** : Pipeline Kanban avec étapes personnalisables
- **AI Prospection** : Recherche automatique de prospects
- **Import CSV** : Import massif de contacts
- **Catégorisation auto** : IA pour catégoriser les entreprises
- **Départements** : Structure interne des entreprises

---

### 3. PROJETS
**Fichiers clés:** `pages/Projects.tsx`, `pages/ProjectDetail.tsx`, `components/projects/`, `hooks/useProjects.ts`

#### Structure projet
```typescript
interface Project {
  id: string;
  name: string;
  code: string;                    // Code interne (ex: "24-015")
  client_company_id: string;       // Lien CRM
  project_type: string;            // neuf, renovation, etc.
  status: string;                  // Prospect → Terminé
  discipline: string;              // architecture, communication
  budget_travaux?: number;
  surface?: number;
  address, city, postal_code;
  start_date, end_date;
  // ... 40+ champs
}
```

#### Onglets projet
| Onglet | Composant | Description |
|--------|-----------|-------------|
| Synthèse | ProjectDetail | Vue d'ensemble |
| Phases | ProjectPhasesTab | Timeline Gantt des phases MOE |
| Livrables | ProjectDeliverablesTab | Documents à produire |
| Tâches | ProjectTasksTab | Tâches liées au projet |
| Commercial | ProjectCommercialTab | Devis/contrats liés |
| Budget | ProjectBudgetTab | Suivi budgétaire |
| MOE | ProjectMOETab | Équipe de maîtrise d'œuvre |
| Documents | ProjectDocumentsTab | GED projet |
| Chantier | ProjectChantierTab | Suivi exécution |

#### Phases MOE (architecture)
Phases standards loi MOP : ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR
- Timeline interactive (Gantt)
- Dépendances entre phases
- Livrables par phase
- Calcul automatique des dates

---

### 4. COMMERCIAL (Devis & Contrats)
**Fichiers clés:** `pages/Commercial.tsx`, `pages/QuoteBuilder.tsx`, `components/commercial/`, `hooks/useCommercialDocuments.ts`

#### Types de documents
- **Devis** (quote)
- **Contrat** (contract)
- **Avenant** (amendment)
- **Lettre de commande** (order_letter)

#### Modes de calcul
| Mode | Description |
|------|-------------|
| `percentage` | % sur montant travaux |
| `fixed` | Montant forfaitaire |
| `hourly` | Taux horaire × temps |
| `mixed` | Combinaison |

#### Workflow devis
```
Brouillon → Envoyé → Accepté → Signé
                  ↘ Refusé
                  ↘ Expiré
```

#### Fonctionnalités
- Éditeur de phases (drag & drop)
- Calcul automatique honoraires
- Thèmes PDF personnalisables
- Signature électronique
- Versioning des documents
- Conversion devis → projet
- Échéancier de facturation

---

### 5. APPELS D'OFFRES (Tenders)
**Fichiers clés:** `pages/Tenders.tsx`, `pages/TenderDetail.tsx`, `components/tenders/`, `hooks/useTenders.ts`

#### Pipeline appels d'offres
```
Veille → Analyse → Go/No-Go → Rédaction → Envoyé → Attente → Gagné/Perdu
```

#### Analyse IA des DCE
- Upload documents (PDF)
- Extraction automatique :
  - Dates limites
  - Critères de sélection
  - Pièces à fournir
  - Budget estimé
  - Allotissement

#### Onglets
| Onglet | Description |
|--------|-------------|
| Synthèse | Infos clés extraites par IA |
| Équipe | Constitution groupement |
| Livrables | Documents à produire |
| Mémoire | Assistant rédaction mémoire technique |
| Documents | GED appel d'offres |

#### Configuration par discipline
Fichiers `src/lib/disciplines/` :
- `architecture.ts` : Phases MOE, honoraires %
- `communication.ts` : Accord-cadre, lots, cas pratique
- `scenographie.ts` : Exposition, itinérance

---

### 6. FACTURATION
**Fichiers clés:** `pages/Invoicing.tsx`, `components/invoicing/`, `hooks/useInvoices.ts`

#### Statuts facture
```
Brouillon → Envoyée → Payée (partiel) → Payée → En retard
                                              → Annulée (→ Avoir)
```

#### Fonctionnalités
- Génération depuis échéancier devis
- PDF conforme (Factur-X)
- Suivi des paiements
- Relances automatiques
- Avoirs
- Export comptable
- Chorus Pro (marchés publics)

---

### 7. TÂCHES
**Fichiers clés:** `pages/Tasks.tsx`, `components/tasks/`, `hooks/useTasks.ts`

#### Structure tâche
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id?: string;
  assignees: string[];        // Multi-assignation
  due_date?: Date;
  estimated_duration?: number; // minutes
  tags: string[];
  parent_task_id?: string;    // Sous-tâches
  // ...
}
```

#### Vues
- **Kanban** : Colonnes par statut (drag & drop)
- **Liste** : Table filtrable/triable
- **Archives** : Tâches terminées

#### Fonctionnalités
- Sous-tâches
- Commentaires & mentions
- Suivi du temps
- Filtres avancés
- Quick tasks (création rapide)

---

### 8. PLANNING & WORKFLOW
**Fichiers clés:** `pages/Workflow.tsx`, `components/workflow/`, `hooks/usePlanningData.ts`

#### Planning équipe
- Vue hebdomadaire/mensuelle
- Grille par membre
- Entrées de temps (time entries)
- Absences (congés, maladie, école)
- Affectation tâches sur planning

#### Time tracking
- Timer global
- Saisie manuelle
- Imputation projet/tâche
- Validation par manager
- Export feuilles de temps

---

### 9. ÉQUIPE & RH
**Fichiers clés:** `pages/Team.tsx`, `components/team/`, `hooks/useTeamMembers.ts`

#### Sous-modules
| Module | Description |
|--------|-------------|
| Annuaire | Fiches collaborateurs |
| Temps | Suivi temps passé |
| Absences | Gestion congés |
| Salaires | Infos rémunération |
| Entretiens | Évaluations annuelles |
| Variables paie | Export comptable |

#### Gestion alternants
- Calendrier école/entreprise
- Import PDF planning école
- Calcul automatique jours

---

### 10. DOCUMENTS (GED)
**Fichiers clés:** `pages/Documents.tsx`, `components/documents/`, `hooks/useAgencyDocuments.ts`

#### Catégories
- Administratif
- Projet
- RH
- Commercial

#### Fonctionnalités
- Upload multi-fichiers
- Versionning
- Signature électronique
- Templates
- Génération PDF

---

### 11. RÉFÉRENCES (Portfolio)
**Fichiers clés:** `pages/References.tsx`, `hooks/useReferences.ts`

Gestion du portfolio de l'agence :
- Fiches projet avec images
- Tags & filtres
- Export PDF
- Mise en avant (featured)

---

### 12. CAMPAGNES (Communication)
**Fichiers clés:** `pages/Campaigns.tsx`, `components/campaigns/`, `hooks/useCampaigns.ts`

Pour agences de communication :
- Gestion campagnes clients
- Brief créatif
- Livrables (deliverables)
- KPIs & budget

---

### 13. MEDIA PLANNING
**Fichiers clés:** `pages/MediaPlanning.tsx`, `hooks/useMediaPlanning.ts`

Planification des insertions média :
- Calendrier des placements
- Budget par support
- Tracking des diffusions

---

### 14. MESSAGES (Chat interne)
**Fichiers clés:** `pages/Messages.tsx`, `components/messages/`, `hooks/useTeamMessages.ts`

- Canaux d'équipe
- Messages directs
- Mentions
- Réactions emoji
- Fichiers joints

---

### 15. PARAMÈTRES
**Fichiers clés:** `pages/Settings.tsx`, `components/settings/`

#### Sections
| Section | Description |
|---------|-------------|
| Workspace | Nom, logo, couleurs, modules |
| Membres | Gestion utilisateurs & rôles |
| Permissions | Matrice de permissions |
| Commercial | Taux TVA, CGV, templates devis |
| Projets | Types, catégories, phases par défaut |
| Tenders | Config par discipline |
| CRM | Pipelines, catégories entreprises |
| Documents | Templates |
| Intégrations | Gmail, calendriers |

---

## 🗄️ MODÈLE DE DONNÉES

### Tables principales (50+)

#### Core
| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs |
| `workspaces` | Espaces de travail |
| `workspace_members` | Appartenance workspace |
| `workspace_settings` | Configuration |
| `workspace_modules` | Modules activés |

#### CRM
| Table | Description |
|-------|-------------|
| `crm_companies` | Entreprises |
| `contacts` | Contacts |
| `leads` | Opportunités |
| `crm_pipelines` | Pipelines |
| `crm_pipeline_stages` | Étapes pipeline |
| `contact_pipeline_entries` | Entrées prospection |
| `communications` | Historique échanges |

#### Projets
| Table | Description |
|-------|-------------|
| `projects` | Projets |
| `project_phases` | Phases projet |
| `project_deliverables` | Livrables |
| `project_team` | Équipe projet |
| `project_contacts` | Contacts projet |
| `project_elements` | Éléments (lots chantier) |
| `sub_projects` | Sous-projets |

#### Commercial
| Table | Description |
|-------|-------------|
| `commercial_documents` | Devis/contrats |
| `commercial_document_phases` | Lignes du devis |
| `commercial_document_schedule` | Échéancier |
| `commercial_document_versions` | Historique versions |
| `commercial_templates` | Modèles |
| `quote_themes` | Thèmes PDF |

#### Facturation
| Table | Description |
|-------|-------------|
| `invoices` | Factures |
| `invoice_items` | Lignes facture |
| `invoice_payments` | Paiements |
| `credit_notes` | Avoirs |

#### Tâches & Planning
| Table | Description |
|-------|-------------|
| `tasks` | Tâches |
| `task_comments` | Commentaires |
| `task_schedules` | Planification |
| `time_entries` | Entrées temps |
| `team_absences` | Absences |

#### Appels d'offres
| Table | Description |
|-------|-------------|
| `tenders` | Appels d'offres |
| `tender_lots` | Allotissement |
| `tender_deliverables` | Livrables AO |
| `tender_partner_candidates` | Partenaires |
| `tender_required_documents` | Pièces requises |
| `tender_sections` | Sections mémoire |

#### Autres
| Table | Description |
|-------|-------------|
| `agency_documents` | Documents GED |
| `references` | Références portfolio |
| `campaigns` | Campagnes |
| `team_members` | Infos RH |
| `team_evaluations` | Entretiens |
| `notifications` | Notifications |

### Relations clés

```
workspace
  └── crm_companies
        └── contacts
        └── leads
        └── billing_profiles
  └── projects
        └── project_phases
        └── project_deliverables
        └── tasks
        └── commercial_documents
        └── invoices
  └── tenders
        └── tender_lots
        └── tender_deliverables
  └── team_members
        └── time_entries
        └── team_absences
```

---

## 🔐 SYSTÈME D'AUTHENTIFICATION & PERMISSIONS

### AuthContext
**Fichier:** `src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;           // Supabase user
  session: Session | null;
  profile: Profile | null;     // Profil étendu
  workspaces: Workspace[];     // Workspaces accessibles
  activeWorkspace: Workspace | null;
  
  signUp(email, password, fullName): Promise;
  signIn(email, password): Promise;
  signOut(): Promise;
  setActiveWorkspace(workspaceId): Promise;
  refreshProfile(): Promise;
}
```

### Rôles
| Rôle | Description |
|------|-------------|
| `owner` | Propriétaire workspace |
| `admin` | Administrateur |
| `manager` | Chef de projet |
| `member` | Collaborateur |
| `external` | Externe (accès limité) |

### Permissions
**Fichier:** `src/lib/permissions.ts`

```typescript
const PERMISSIONS = {
  // Projets
  'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
  
  // Commercial
  'quotes.view', 'quotes.create', 'quotes.send', 'quotes.sign',
  
  // Facturation
  'invoices.view', 'invoices.create', 'invoices.send',
  
  // RH
  'team.view', 'team.manage', 'team.salaries',
  
  // Admin
  'settings.view', 'settings.edit', 'members.manage',
  // ...
};
```

### PermissionGate
**Fichier:** `src/components/auth/PermissionGate.tsx`

```tsx
<PermissionGate permission="quotes.send">
  <SendQuoteButton />
</PermissionGate>

<PermissionGate minRole="manager">
  <ManagerOnlyContent />
</PermissionGate>
```

### Row Level Security (RLS)
Toutes les tables ont des policies RLS basées sur :
- `workspace_id` : Isolation par workspace
- `auth.uid()` : Utilisateur connecté
- `workspace_members` : Appartenance vérifiée

---

## ⚡ EDGE FUNCTIONS (BACKEND)

### Catégories de fonctions (70+)

#### IA & Analyse
| Fonction | Description |
|----------|-------------|
| `analyze-dce-before-creation` | Analyse DCE avec IA |
| `analyze-tender-documents` | Extraction données appel d'offres |
| `ai-planning-suggestions` | Suggestions planning IA |
| `ai-prospect-search` | Recherche prospects IA |
| `generate-email-content` | Génération emails |
| `generate-subtasks` | Génération sous-tâches |
| `suggest-commercial-phases` | Suggestion phases devis |
| `linea-assistant` | Assistant IA général |

#### PDF & Documents
| Fonction | Description |
|----------|-------------|
| `generate-pdf` | Génération PDF générique |
| `generate-pdf-chromium` | PDF haute qualité (Chromium) |
| `generate-quote-html` | HTML devis pour PDF |
| `generate-html-pdf` | Conversion HTML → PDF |
| `generate-signed-pdf` | PDF avec signature |

#### Email
| Fonction | Description |
|----------|-------------|
| `gmail-oauth-callback` | Auth Gmail |
| `gmail-sync` | Synchronisation emails |
| `gmail-send-email` | Envoi via Gmail |
| `send-quote-email` | Envoi devis |
| `send-invite` | Invitation workspace |
| `send-meeting-convocation` | Convocation réunion |

#### Portails externes
| Fonction | Description |
|----------|-------------|
| `public-quote-view` | Vue devis public |
| `public-quote-sign` | Signature devis |
| `client-portal-view` | Portail client |
| `company-portal-view` | Portail entreprise |
| `framework-request-submit` | Demande accord-cadre |

#### Intégrations
| Fonction | Description |
|----------|-------------|
| `chorus-pro-submit` | Soumission Chorus Pro |
| `fetch-company-logo` | Récupération logo entreprise |
| `parse-school-calendar` | Parse calendrier alternance |
| `parse-bpu-file` | Parse BPU Excel |

### Structure type d'une Edge Function

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await req.json();
    
    // Logique métier...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 🎨 PATTERNS & CONVENTIONS

### Hooks de données

Tous les hooks de données suivent le pattern TanStack Query :

```typescript
// hooks/useProjects.ts
export function useProjects(filters?: ProjectFilters) {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ["projects", activeWorkspace?.id, filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:crm_companies(*)")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (project: CreateProjectInput) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Projet créé" });
    },
  });
}
```

### Composants Dialog/Sheet

Pattern standard pour les modales :

```tsx
// CreateEntityDialog.tsx
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Entity>;
  onSuccess?: (entity: Entity) => void;
}

export function CreateEntityDialog({ open, onOpenChange, ...props }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: props.defaultValues,
  });
  
  const { mutate, isPending } = useCreateEntity();
  
  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: (data) => {
        onOpenChange(false);
        props.onSuccess?.(data);
      },
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Fields */}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Design tokens

**Fichier:** `src/index.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  /* + custom tokens par workspace */
}
```

### Navigation config

**Fichier:** `src/lib/navigationConfig.ts`

Définition centralisée de tous les modules avec :
- Slug, titre, icône
- Sous-navigation
- Quick actions

---

## 🔌 INTÉGRATIONS EXTERNES

### Gmail
- OAuth 2.0
- Synchronisation emails
- Envoi depuis l'app
- Association aux entités CRM

### Calendriers
- Google Calendar
- Outlook (via OAuth)
- Sync bidirectionnelle
- Événements workspace

### Chorus Pro
- Soumission factures marchés publics
- Format Factur-X
- Suivi des statuts

### API SIRENE (INSEE)
- Recherche entreprises par SIRET
- Auto-complétion données

### Stockage
- Supabase Storage
- Buckets par type (documents, avatars, logos)
- Policies RLS

---

## 📊 RÉCAPITULATIF

| Métrique | Valeur |
|----------|--------|
| Pages | 55+ |
| Composants | 400+ |
| Hooks | 170+ |
| Edge Functions | 70+ |
| Tables DB | 50+ |
| Modules | 15 |
| Routes | 80+ |

### Points forts de l'architecture
1. **Séparation claire** : Pages → Composants → Hooks → API
2. **Cache intelligent** : TanStack Query avec invalidation fine
3. **Sécurité** : RLS + PermissionGate frontend
4. **Modularité** : Modules activables par workspace
5. **Multi-discipline** : Configuration dynamique selon métier
6. **IA intégrée** : Analyse documents, génération contenu
7. **Temps réel** : Notifications, collaboration

### Points d'attention pour rebuild
1. Le système de disciplines (`src/lib/disciplines/`) est central pour l'adaptation métier
2. Les Edge Functions sont critiques pour PDF et IA
3. Le système de permissions est granulaire (vérifier RLS + frontend)
4. Les templates de documents (devis, factures) sont complexes
5. L'intégration Gmail nécessite OAuth configuré

---

*Document généré automatiquement - Blueprint v1.0*
