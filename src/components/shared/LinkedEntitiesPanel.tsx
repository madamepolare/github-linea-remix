import { Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  FolderKanban, 
  FileText, 
  Receipt, 
  Target,
  Briefcase,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntityRelations, EntityType } from '@/hooks/useEntityRelations';
import { cn } from '@/lib/utils';

interface LinkedEntitiesPanelProps {
  entityType: EntityType;
  entityId: string | undefined;
  workspaceId: string | undefined;
  className?: string;
}

const entityConfig: Record<EntityType, { icon: React.ElementType; label: string; route: string; color: string }> = {
  project: { icon: FolderKanban, label: 'Projet', route: '/projects', color: 'text-blue-500' },
  lead: { icon: Target, label: 'Lead', route: '/crm/leads', color: 'text-orange-500' },
  company: { icon: Building2, label: 'Entreprise', route: '/crm/companies', color: 'text-purple-500' },
  contact: { icon: User, label: 'Contact', route: '/crm/contacts', color: 'text-green-500' },
  tender: { icon: Briefcase, label: 'Appel d\'offres', route: '/tenders', color: 'text-amber-500' },
  invoice: { icon: Receipt, label: 'Facture', route: '/invoicing', color: 'text-emerald-500' },
  document: { icon: FileText, label: 'Document', route: '/commercial', color: 'text-indigo-500' },
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  completed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  won: 'bg-green-500/10 text-green-700 dark:text-green-400',
  lost: 'bg-red-500/10 text-red-700 dark:text-red-400',
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  signed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

function EntityLink({ 
  type, 
  id, 
  name, 
  status, 
  metadata 
}: { 
  type: EntityType; 
  id: string; 
  name: string; 
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  const config = entityConfig[type];
  const Icon = config.icon;
  
  const getRoute = () => {
    if (type === 'invoice') return `/invoicing?id=${id}`;
    if (type === 'document') return `/commercial/${id}`;
    return `${config.route}/${id}`;
  };

  return (
    <Link
      to={getRoute()}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div className={cn("p-1.5 rounded-md bg-muted", config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        {metadata?.total && (
          <p className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(metadata.total as number)}
          </p>
        )}
      </div>
      {status && (
        <Badge variant="outline" className={cn("text-xs", statusColors[status] || '')}>
          {status}
        </Badge>
      )}
      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function EntitySection({ 
  title, 
  entities, 
  type,
  emptyMessage 
}: { 
  title: string; 
  entities: Array<{ id: string; name: string; status?: string; type: EntityType; metadata?: Record<string, unknown> }>;
  type: EntityType;
  emptyMessage?: string;
}) {
  const config = entityConfig[type];
  const Icon = config.icon;

  if (entities.length === 0 && !emptyMessage) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className={cn("h-4 w-4", config.color)} />
        <span>{title}</span>
        {entities.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {entities.length}
          </Badge>
        )}
      </div>
      {entities.length > 0 ? (
        <div className="space-y-1">
          {entities.map((entity) => (
            <EntityLink 
              key={entity.id} 
              type={entity.type} 
              id={entity.id} 
              name={entity.name} 
              status={entity.status}
              metadata={entity.metadata}
            />
          ))}
        </div>
      ) : emptyMessage ? (
        <p className="text-xs text-muted-foreground italic py-2">{emptyMessage}</p>
      ) : null}
    </div>
  );
}

export function LinkedEntitiesPanel({ entityType, entityId, workspaceId, className }: LinkedEntitiesPanelProps) {
  const { data: relations, isLoading } = useEntityRelations(entityType, entityId, workspaceId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entités liées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!relations) return null;

  const hasSingleRelations = relations.lead || relations.project || relations.company || relations.contact || relations.tender;
  const hasMultipleRelations = relations.leads?.length || relations.projects?.length || 
    relations.invoices?.length || relations.commercialDocuments?.length || 
    relations.contacts?.length || relations.tenders?.length;

  if (!hasSingleRelations && !hasMultipleRelations) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            Entités liées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Aucune entité liée pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          Entités liées
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 pr-4">
            {/* Single relations */}
            {relations.lead && (
              <EntitySection 
                title="Lead d'origine" 
                entities={[relations.lead]} 
                type="lead" 
              />
            )}
            {relations.project && (
              <EntitySection 
                title="Projet associé" 
                entities={[relations.project]} 
                type="project" 
              />
            )}
            {relations.company && (
              <EntitySection 
                title="Entreprise" 
                entities={[relations.company]} 
                type="company" 
              />
            )}
            {relations.contact && (
              <EntitySection 
                title="Contact" 
                entities={[relations.contact]} 
                type="contact" 
              />
            )}
            {relations.tender && (
              <EntitySection 
                title="Appel d'offres" 
                entities={[relations.tender]} 
                type="tender" 
              />
            )}

            {/* Multiple relations */}
            {relations.leads && relations.leads.length > 0 && (
              <EntitySection 
                title="Leads" 
                entities={relations.leads} 
                type="lead" 
              />
            )}
            {relations.projects && relations.projects.length > 0 && (
              <EntitySection 
                title="Projets" 
                entities={relations.projects} 
                type="project" 
              />
            )}
            {relations.contacts && relations.contacts.length > 0 && (
              <EntitySection 
                title="Contacts" 
                entities={relations.contacts} 
                type="contact" 
              />
            )}
            {relations.commercialDocuments && relations.commercialDocuments.length > 0 && (
              <EntitySection 
                title="Documents commerciaux" 
                entities={relations.commercialDocuments} 
                type="document" 
              />
            )}
            {relations.invoices && relations.invoices.length > 0 && (
              <EntitySection 
                title="Factures" 
                entities={relations.invoices} 
                type="invoice" 
              />
            )}
            {relations.tenders && relations.tenders.length > 0 && (
              <EntitySection 
                title="Appels d'offres" 
                entities={relations.tenders} 
                type="tender" 
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
