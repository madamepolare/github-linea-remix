import { getWidgetById } from "./registry";
import { WidgetWrapper } from "./WidgetWrapper";
import {
  WelcomeWidget,
  QuickActionsWidget,
  ActivityWidget,
  ProjectsStatsWidget,
  TasksWidget,
  ProjectsPipelineWidget,
  ActiveProjectsWidget,
  InvoicingStatsWidget,
  TendersStatsWidget,
  CRMStatsWidget,
  CampaignsStatsWidget,
  TeamStatsWidget,
  PlaceholderWidget,
  RevenueChartWidget,
  LeadsPipelineWidget,
  RecentLeadsWidget,
  RevenueByCategoryWidget,
  RevenueByTypeWidget,
} from "./content";

interface WidgetRendererProps {
  widgetId: string;
  isEditing?: boolean;
  onRemove?: () => void;
  widthCols?: number;
}

export function WidgetRenderer({ widgetId, isEditing, onRemove, widthCols }: WidgetRendererProps) {
  const config = getWidgetById(widgetId);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center bg-muted rounded-xl">
        <PlaceholderWidget title="Widget non trouvé" />
      </div>
    );
  }

  const renderContent = () => {
    switch (config.type) {
      // General
      case "welcome":
        return <WelcomeWidget />;
      case "quick-actions":
        return <QuickActionsWidget />;
      case "activity-feed":
        return <ActivityWidget />;
      case "notifications":
        return <PlaceholderWidget title="Notifications" />;

      // Projects
      case "projects-stats":
        return <ProjectsStatsWidget />;
      case "projects-pipeline":
        return <ProjectsPipelineWidget />;
      case "projects-active":
        return <ActiveProjectsWidget />;
      case "projects-tasks":
        return <TasksWidget />;
      case "projects-deadlines":
        return <PlaceholderWidget title="Échéances projets" />;

      // CRM
      case "crm-stats":
        return <CRMStatsWidget />;
      case "crm-leads":
        return <RecentLeadsWidget />;
      case "crm-pipeline":
        return <LeadsPipelineWidget />;
      case "crm-companies":
        return <PlaceholderWidget title="Entreprises" />;

      // Commercial
      case "commercial-stats":
        return <PlaceholderWidget title="Stats commerciales" />;
      case "commercial-pipeline":
        return <PlaceholderWidget title="Pipeline commercial" />;
      case "commercial-quotes":
        return <PlaceholderWidget title="Devis récents" />;

      // Campaigns
      case "campaigns-stats":
        return <CampaignsStatsWidget />;
      case "campaigns-active":
        return <PlaceholderWidget title="Campagnes actives" />;
      case "campaigns-calendar":
        return <PlaceholderWidget title="Calendrier publications" />;

      // Tenders
      case "tenders-stats":
        return <TendersStatsWidget />;
      case "tenders-active":
        return <PlaceholderWidget title="AO actifs" />;
      case "tenders-deadlines":
        return <PlaceholderWidget title="Échéances AO" />;

      // Invoicing
      case "invoicing-stats":
        return <InvoicingStatsWidget />;
      case "invoicing-pending":
        return <PlaceholderWidget title="Factures en attente" />;
      case "invoicing-chart":
        return <RevenueChartWidget />;
      case "invoicing-by-category":
        return <RevenueByCategoryWidget />;
      case "invoicing-by-type":
        return <RevenueByTypeWidget />;

      // Documents
      case "documents-stats":
        return <PlaceholderWidget title="Stats documents" />;
      case "documents-expiring":
        return <PlaceholderWidget title="Documents à renouveler" />;
      case "documents-recent":
        return <PlaceholderWidget title="Documents récents" />;

      // Team
      case "team-stats":
        return <TeamStatsWidget />;
      case "team-members":
        return <PlaceholderWidget title="Membres équipe" />;
      case "team-workload":
        return <PlaceholderWidget title="Charge de travail" />;

      // References
      case "references-recent":
        return <PlaceholderWidget title="Références récentes" />;
      case "references-featured":
        return <PlaceholderWidget title="Références à la une" />;

      // Materials
      case "materials-recent":
        return <PlaceholderWidget title="Matériaux récents" />;
      case "materials-categories":
        return <PlaceholderWidget title="Catégories" />;

      // Objects
      case "objects-recent":
        return <PlaceholderWidget title="Objets récents" />;
      case "objects-favorites":
        return <PlaceholderWidget title="Objets favoris" />;

      // Permits & Insurances
      case "permits-upcoming":
        return <PlaceholderWidget title="Permis à suivre" />;
      case "insurances-expiring":
        return <PlaceholderWidget title="Assurances à renouveler" />;

      default:
        return <PlaceholderWidget title={config.title} />;
    }
  };

  return (
    <WidgetWrapper
      title={config.title}
      icon={config.icon}
      isEditing={isEditing}
      onRemove={onRemove}
      module={isEditing ? config.module : undefined}
      widthCols={widthCols}
    >
      {renderContent()}
    </WidgetWrapper>
  );
}
