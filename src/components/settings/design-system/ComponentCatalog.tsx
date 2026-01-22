import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Copy, Loader2, CreditCard, FileText, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

// Pattern imports
import {
  LoadingState,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  PageLoader,
  ButtonLoader,
  InlineLoader,
  StandardCard,
  CompactCard,
  SpaciousCard,
  InteractiveCard,
  StatsCard,
  FormDialog,
  CreateDialog,
  EditDialog,
  DetailSheet,
  DetailSection,
  DetailRow,
  DetailGrid,
  DetailDivider,
  ConfirmDialog,
  DeleteDialog,
  ArchiveDialog,
} from "@/components/ui/patterns";

interface ComponentExample {
  name: string;
  description: string;
  code: string;
  preview: React.ReactNode;
}

interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  examples: ComponentExample[];
}

const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: "loading",
    name: "États de chargement",
    description: "Composants pour afficher les états de chargement et les squelettes.",
    examples: [
      {
        name: "LoadingState - Spinner",
        description: "Spinner centré pour chargement de page ou section.",
        code: `import { LoadingState } from "@/components/ui/patterns";

<LoadingState variant="spinner" size="md" text="Chargement..." />`,
        preview: (
          <div className="h-24 flex items-center justify-center">
            <LoadingState variant="spinner" size="md" text="Chargement..." />
          </div>
        ),
      },
      {
        name: "LoadingState - Skeleton",
        description: "Squelettes pour pré-remplir le contenu.",
        code: `import { LoadingState } from "@/components/ui/patterns";

<LoadingState variant="skeleton" rows={3} />`,
        preview: (
          <div className="p-4">
            <LoadingState variant="skeleton" rows={3} />
          </div>
        ),
      },
      {
        name: "TableSkeleton",
        description: "Squelette optimisé pour les tableaux.",
        code: `import { TableSkeleton } from "@/components/ui/patterns";

<TableSkeleton rows={3} columns={4} />`,
        preview: (
          <div className="p-2">
            <TableSkeleton rows={3} columns={3} />
          </div>
        ),
      },
      {
        name: "CardSkeleton",
        description: "Squelettes pour grilles de cartes.",
        code: `import { CardSkeleton } from "@/components/ui/patterns";

<CardSkeleton count={2} />`,
        preview: (
          <div className="p-2">
            <CardSkeleton count={2} />
          </div>
        ),
      },
      {
        name: "ButtonLoader",
        description: "Indicateur de chargement dans les boutons.",
        code: `import { ButtonLoader } from "@/components/ui/patterns";

<Button disabled>
  <ButtonLoader />
  Enregistrement...
</Button>`,
        preview: (
          <Button disabled>
            <ButtonLoader />
            Enregistrement...
          </Button>
        ),
      },
      {
        name: "InlineLoader",
        description: "Chargement inline avec texte optionnel.",
        code: `import { InlineLoader } from "@/components/ui/patterns";

<InlineLoader text="Synchronisation..." />`,
        preview: <InlineLoader text="Synchronisation..." />,
      },
    ],
  },
  {
    id: "cards",
    name: "Cartes",
    description: "Composants de carte avec padding standardisé et variantes.",
    examples: [
      {
        name: "StandardCard",
        description: "Carte par défaut avec header et actions optionnels.",
        code: `import { StandardCard } from "@/components/ui/patterns";

<StandardCard
  title="Titre de la carte"
  description="Description optionnelle"
  headerActions={<Button size="sm">Action</Button>}
>
  Contenu de la carte
</StandardCard>`,
        preview: (
          <StandardCard
            title="Titre de la carte"
            description="Description optionnelle"
            headerActions={<Button size="sm" variant="outline">Action</Button>}
          >
            <p className="text-muted-foreground">Contenu de la carte avec le padding par défaut.</p>
          </StandardCard>
        ),
      },
      {
        name: "CompactCard",
        description: "Carte avec padding réduit (12px).",
        code: `import { CompactCard } from "@/components/ui/patterns";

<CompactCard title="Compact">Contenu</CompactCard>`,
        preview: (
          <CompactCard title="Compact">
            <p className="text-sm text-muted-foreground">Padding réduit pour les espaces contraints.</p>
          </CompactCard>
        ),
      },
      {
        name: "SpaciousCard",
        description: "Carte avec padding généreux (24px).",
        code: `import { SpaciousCard } from "@/components/ui/patterns";

<SpaciousCard title="Spacieuse">Contenu</SpaciousCard>`,
        preview: (
          <SpaciousCard title="Spacieuse">
            <p className="text-muted-foreground">Padding généreux pour les contenus importants.</p>
          </SpaciousCard>
        ),
      },
      {
        name: "InteractiveCard",
        description: "Carte cliquable avec effet hover.",
        code: `import { InteractiveCard } from "@/components/ui/patterns";

<InteractiveCard title="Cliquable" onClick={() => {}}>
  Contenu
</InteractiveCard>`,
        preview: (
          <InteractiveCard title="Cliquable" onClick={() => toast.info("Carte cliquée!")}>
            <p className="text-sm text-muted-foreground">Cliquez pour interagir.</p>
          </InteractiveCard>
        ),
      },
      {
        name: "StatsCard",
        description: "Carte de statistique avec tendance optionnelle.",
        code: `import { StatsCard } from "@/components/ui/patterns";
import { TrendingUp } from "lucide-react";

<StatsCard
  title="Chiffre d'affaires"
  value="24 500 €"
  description="Ce mois"
  icon={<TrendingUp className="h-4 w-4" />}
  trend={{ value: 12 }}
/>`,
        preview: (
          <StatsCard
            title="Chiffre d'affaires"
            value="24 500 €"
            description="Ce mois"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={{ value: 12 }}
          />
        ),
      },
    ],
  },
  {
    id: "dialogs",
    name: "Dialogues",
    description: "Dialogues modaux pour formulaires et confirmations.",
    examples: [
      {
        name: "FormDialog",
        description: "Dialogue de formulaire générique avec footer standardisé.",
        code: `import { FormDialog } from "@/components/ui/patterns";

<FormDialog
  open={open}
  onOpenChange={setOpen}
  title="Modifier l'élément"
  description="Remplissez les champs ci-dessous"
  onSubmit={handleSubmit}
  isSubmitting={isLoading}
>
  {/* Champs de formulaire */}
</FormDialog>`,
        preview: (
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground text-center">
              Voir le code pour l'utilisation (composant modal)
            </p>
          </div>
        ),
      },
      {
        name: "CreateDialog",
        description: "Variante pour la création (label \"Créer\").",
        code: `import { CreateDialog } from "@/components/ui/patterns";

<CreateDialog
  open={open}
  onOpenChange={setOpen}
  title="Nouveau projet"
  onSubmit={handleCreate}
>
  {/* Champs */}
</CreateDialog>`,
        preview: (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
            <Badge variant="secondary">Label:</Badge>
            <span className="text-sm">Créer</span>
          </div>
        ),
      },
      {
        name: "EditDialog",
        description: "Variante pour l'édition (label \"Enregistrer\").",
        code: `import { EditDialog } from "@/components/ui/patterns";

<EditDialog
  open={open}
  onOpenChange={setOpen}
  title="Modifier le projet"
  onSubmit={handleEdit}
>
  {/* Champs */}
</EditDialog>`,
        preview: (
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/30">
            <Badge variant="secondary">Label:</Badge>
            <span className="text-sm">Enregistrer</span>
          </div>
        ),
      },
      {
        name: "ConfirmDialog",
        description: "Dialogue de confirmation générique.",
        code: `import { ConfirmDialog } from "@/components/ui/patterns";

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="Confirmer l'action"
  description="Êtes-vous sûr de vouloir continuer ?"
  onConfirm={handleConfirm}
  variant="warning"
/>`,
        preview: (
          <div className="flex gap-2 p-4 border rounded-lg bg-muted/30">
            <Badge>default</Badge>
            <Badge variant="destructive">destructive</Badge>
            <Badge className="bg-warning text-warning-foreground">warning</Badge>
          </div>
        ),
      },
      {
        name: "DeleteDialog",
        description: "Dialogue de suppression avec texte prédéfini.",
        code: `import { DeleteDialog } from "@/components/ui/patterns";

<DeleteDialog
  open={open}
  onOpenChange={setOpen}
  itemName="ce projet"
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>`,
        preview: (
          <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <p className="text-sm text-destructive">
              Action destructive - demande confirmation
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "sheets",
    name: "Panneaux latéraux",
    description: "Sheets pour afficher les détails d'un élément.",
    examples: [
      {
        name: "DetailSheet",
        description: "Panneau de détail avec header, contenu scrollable et footer optionnel.",
        code: `import { DetailSheet, DetailSection, DetailRow } from "@/components/ui/patterns";

<DetailSheet
  open={open}
  onOpenChange={setOpen}
  title="Détails du client"
  titleBadge={<Badge>Actif</Badge>}
  size="md"
>
  <DetailSection title="Informations">
    <DetailRow label="Nom" value="Dupont" />
    <DetailRow label="Email" value="dupont@email.com" />
  </DetailSection>
</DetailSheet>`,
        preview: (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Détails du client</span>
              <Badge variant="outline" className="text-xs">Actif</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom</span>
                <span>Dupont</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>dupont@email.com</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "DetailSection",
        description: "Section avec titre optionnel dans un DetailSheet.",
        code: `import { DetailSection, DetailRow } from "@/components/ui/patterns";

<DetailSection title="Facturation">
  <DetailRow label="SIRET" value="123 456 789 00012" />
</DetailSection>`,
        preview: (
          <div className="space-y-2 p-4 border rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground">Facturation</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SIRET</span>
              <span>123 456 789 00012</span>
            </div>
          </div>
        ),
      },
      {
        name: "DetailGrid",
        description: "Grille responsive pour afficher plusieurs valeurs.",
        code: `import { DetailGrid, DetailRow } from "@/components/ui/patterns";

<DetailGrid columns={2}>
  <DetailRow label="Téléphone" value="01 23 45 67 89" />
  <DetailRow label="Mobile" value="06 12 34 56 78" />
</DetailGrid>`,
        preview: (
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg text-sm">
            <div>
              <span className="text-muted-foreground block">Téléphone</span>
              <span>01 23 45 67 89</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Mobile</span>
              <span>06 12 34 56 78</span>
            </div>
          </div>
        ),
      },
      {
        name: "Tailles disponibles",
        description: "Le DetailSheet supporte plusieurs tailles.",
        code: `// Tailles: "sm" | "md" | "lg" | "xl" | "2xl"
<DetailSheet size="lg" ... />`,
        preview: (
          <div className="flex flex-wrap gap-2 p-4">
            <Badge variant="outline">sm: 400px</Badge>
            <Badge variant="outline">md: 540px</Badge>
            <Badge variant="outline">lg: 720px</Badge>
            <Badge variant="outline">xl: 900px</Badge>
            <Badge variant="outline">2xl: 1200px</Badge>
          </div>
        ),
      },
    ],
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copié!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="p-4 rounded-lg bg-muted/50 border overflow-x-auto text-xs">
        <code className="text-foreground">{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

function ComponentExampleCard({ example }: { example: ComponentExample }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h4 className="font-medium">{example.name}</h4>
        <p className="text-sm text-muted-foreground">{example.description}</p>
      </div>
      
      <div className="p-4 border-b min-h-[100px] flex items-center justify-center bg-background">
        {example.preview}
      </div>
      
      <div className="p-4 bg-muted/20">
        <CodeBlock code={example.code} />
      </div>
    </div>
  );
}

export function ComponentCatalog() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Catalogue des composants</h3>
          <p className="text-sm text-muted-foreground">
            Tous les patterns UI disponibles avec exemples et code prêt à copier.
          </p>
        </div>
        <Badge variant="secondary">{COMPONENT_CATEGORIES.length} catégories</Badge>
      </div>

      <Accordion type="multiple" defaultValue={["loading", "cards"]} className="space-y-4">
        {COMPONENT_CATEGORIES.map((category) => (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{category.name}</span>
                <Badge variant="outline" className="text-xs">
                  {category.examples.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
              <div className="grid gap-6">
                {category.examples.map((example, idx) => (
                  <ComponentExampleCard key={idx} example={example} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
