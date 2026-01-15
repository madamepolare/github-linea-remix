import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  User,
  Hammer,
  FolderKanban,
  Target,
  CheckSquare,
  FileText,
  FileStack,
  Shield,
  CreditCard,
  Puzzle,
  Mail,
  Layers,
  MessageSquarePlus,
  Palette,
  Compass,
  ChevronRight,
  Search,
  Settings,
  Euro,
  UserCog,
  Grid3X3,
  Gavel,
  Calendar,
  Building,
  Globe,
  Plug,
} from 'lucide-react';

export interface SettingsSection {
  id: string;
  label: string;
  icon: ReactNode;
  description?: string;
  badge?: string;
}

export interface SettingsGroup {
  id: string;
  label: string;
  sections: SettingsSection[];
}

export function getSettingsGroups(t: (key: string) => string): SettingsGroup[] {
  return [
    {
      id: 'workspace',
      label: t('settings.groups.workspace'),
      sections: [
        { id: 'workspace', label: t('settings.sections.workspace'), icon: <Building2 className="h-4 w-4" />, description: t('settings.sections.workspaceDesc') },
        { id: 'discipline', label: t('settings.sections.discipline'), icon: <Compass className="h-4 w-4" />, description: t('settings.sections.disciplineDesc') },
        { id: 'style', label: t('settings.sections.style'), icon: <Palette className="h-4 w-4" />, description: t('settings.sections.styleDesc') },
        { id: 'modules', label: t('settings.sections.modules'), icon: <Puzzle className="h-4 w-4" />, description: t('settings.sections.modulesDesc') },
        { id: 'plan', label: t('settings.sections.plan'), icon: <CreditCard className="h-4 w-4" />, description: t('settings.sections.planDesc') },
      ],
    },
    {
      id: 'team',
      label: t('settings.groups.team'),
      sections: [
        { id: 'members', label: t('settings.sections.members'), icon: <Users className="h-4 w-4" />, description: t('settings.sections.membersDesc') },
        { id: 'permissions', label: t('settings.sections.permissions'), icon: <Shield className="h-4 w-4" />, description: t('settings.sections.permissionsDesc') },
        { id: 'profile', label: t('settings.sections.profile'), icon: <User className="h-4 w-4" />, description: t('settings.sections.profileDesc') },
        { id: 'language', label: t('settings.sections.language'), icon: <Globe className="h-4 w-4" />, description: t('settings.sections.languageDesc') },
      ],
    },
    {
      id: 'projects',
      label: t('settings.groups.projects'),
      sections: [
        { id: 'projects', label: t('settings.sections.projectsConfig'), icon: <FolderKanban className="h-4 w-4" />, description: t('settings.sections.projectsConfigDesc') },
        { id: 'phases', label: t('settings.sections.phases'), icon: <Layers className="h-4 w-4" />, description: t('settings.sections.phasesDesc') },
        { id: 'lots', label: t('settings.sections.lots'), icon: <Hammer className="h-4 w-4" />, description: t('settings.sections.lotsDesc') },
        { id: 'tasks', label: t('settings.sections.tasks'), icon: <CheckSquare className="h-4 w-4" />, description: t('settings.sections.tasksDesc') },
      ],
    },
    {
      id: 'commercial',
      label: t('settings.groups.commercial'),
      sections: [
        { id: 'contracts', label: t('settings.sections.contracts'), icon: <FileText className="h-4 w-4" />, description: t('settings.sections.contractsDesc') },
        { id: 'skills', label: t('settings.sections.skills'), icon: <UserCog className="h-4 w-4" />, description: t('settings.sections.skillsDesc') },
        { id: 'templates', label: t('settings.sections.templates'), icon: <Grid3X3 className="h-4 w-4" />, description: t('settings.sections.templatesDesc') },
        { id: 'pricing', label: t('settings.sections.pricing'), icon: <Euro className="h-4 w-4" />, description: t('settings.sections.pricingDesc') },
        { id: 'quote-themes', label: t('settings.sections.quoteThemes'), icon: <Palette className="h-4 w-4" />, description: t('settings.sections.quoteThemesDesc'), badge: 'Nouveau' },
      ],
    },
    {
      id: 'documents',
      label: t('settings.groups.documents'),
      sections: [
        { id: 'documents', label: t('settings.sections.documentsConfig'), icon: <FileStack className="h-4 w-4" />, description: t('settings.sections.documentsConfigDesc') },
        { id: 'emails', label: t('settings.sections.emails'), icon: <Mail className="h-4 w-4" />, description: t('settings.sections.emailsDesc') },
      ],
    },
    {
      id: 'tenders',
      label: t('settings.groups.tenders'),
      sections: [
        { id: 'tenders', label: t('settings.sections.tendersConfig'), icon: <Gavel className="h-4 w-4" />, description: t('settings.sections.tendersConfigDesc') },
      ],
    },
    {
      id: 'integrations',
      label: t('settings.groups.integrations'),
      sections: [
        { id: 'integrations', label: t('settings.sections.integrations'), icon: <Plug className="h-4 w-4" />, description: t('settings.sections.integrationsDesc') },
        { id: 'calendars', label: t('settings.sections.calendars'), icon: <Calendar className="h-4 w-4" />, description: t('settings.sections.calendarsDesc') },
      ],
    },
    {
      id: 'crm',
      label: t('settings.groups.crm'),
      sections: [
        { id: 'crm-pipelines', label: t('settings.sections.crmPipelines'), icon: <Target className="h-4 w-4" />, description: t('settings.sections.crmPipelinesDesc') },
        { id: 'crm-companies', label: t('settings.sections.crmCompanies'), icon: <Building className="h-4 w-4" />, description: t('settings.sections.crmCompaniesDesc') },
        { id: 'crm-contacts', label: t('settings.sections.crmContacts'), icon: <Users className="h-4 w-4" />, description: t('settings.sections.crmContactsDesc') },
        { id: 'crm-sources', label: t('settings.sections.crmSources'), icon: <Target className="h-4 w-4" />, description: t('settings.sections.crmSourcesDesc') },
        { id: 'crm-advanced', label: t('settings.sections.crmAdvanced'), icon: <Settings className="h-4 w-4" />, description: t('settings.sections.crmAdvancedDesc') },
      ],
    },
    {
      id: 'feedback',
      label: t('settings.groups.feedback'),
      sections: [
        { id: 'feedback', label: t('settings.sections.feedback'), icon: <MessageSquarePlus className="h-4 w-4" />, description: t('settings.sections.feedbackDesc') },
      ],
    },
    {
      id: 'development',
      label: 'Développement',
      sections: [
        { id: 'design-system', label: 'Design System', icon: <Palette className="h-4 w-4" />, description: 'Catalogue visuel des composants UI', badge: 'Admin' },
      ],
    },
  ];
}

interface SettingsLayoutProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  children: ReactNode;
}

export function SettingsLayout({ activeSection, onSectionChange, children }: SettingsLayoutProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const settingsGroups = getSettingsGroups(t);

  // Get the current section info
  const currentSection = settingsGroups.flatMap(g => g.sections).find(s => s.id === activeSection);

  // Filter sections based on search
  const filteredGroups = settingsGroups.map(group => ({
    ...group,
    sections: group.sections.filter(
      section =>
        section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(group => group.sections.length > 0);

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[500px]">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col shrink-0">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.id}>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => onSectionChange(section.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors',
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <span className={cn(
                        'shrink-0',
                        activeSection === section.id ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {section.icon}
                      </span>
                      <span className="flex-1 truncate">{section.label}</span>
                      {section.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {section.badge}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-background shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Settings className="h-3.5 w-3.5" />
            <span>Paramètres</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{currentSection?.label}</span>
          </div>
          {currentSection?.description && (
            <p className="text-sm text-muted-foreground">
              {currentSection.description}
            </p>
          )}
        </div>

        {/* Main content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
