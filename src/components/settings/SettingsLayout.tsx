import { ReactNode, useState } from 'react';
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

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    sections: [
      { id: 'workspace', label: 'Informations', icon: <Building2 className="h-4 w-4" />, description: 'Nom, logo, coordonnées' },
      { id: 'discipline', label: 'Discipline', icon: <Compass className="h-4 w-4" />, description: 'Métier et spécialisation' },
      { id: 'style', label: 'Style visuel', icon: <Palette className="h-4 w-4" />, description: 'Couleurs, polices, thème' },
      { id: 'modules', label: 'Modules', icon: <Puzzle className="h-4 w-4" />, description: 'Fonctionnalités activées' },
      { id: 'plan', label: 'Plan & Facturation', icon: <CreditCard className="h-4 w-4" />, description: 'Abonnement actuel' },
    ],
  },
  {
    id: 'team',
    label: 'Équipe',
    sections: [
      { id: 'members', label: 'Membres', icon: <Users className="h-4 w-4" />, description: 'Gestion des utilisateurs' },
      { id: 'permissions', label: 'Permissions', icon: <Shield className="h-4 w-4" />, description: 'Rôles et accès' },
      { id: 'profile', label: 'Mon profil', icon: <User className="h-4 w-4" />, description: 'Paramètres personnels' },
    ],
  },
  {
    id: 'projects',
    label: 'Projets',
    sections: [
      { id: 'projects', label: 'Configuration', icon: <FolderKanban className="h-4 w-4" />, description: 'Statuts, types de projets' },
      { id: 'phases', label: 'Phases', icon: <Layers className="h-4 w-4" />, description: 'Templates de phases' },
      { id: 'lots', label: 'Lots', icon: <Hammer className="h-4 w-4" />, description: 'Templates de lots' },
      { id: 'tasks', label: 'Tâches', icon: <CheckSquare className="h-4 w-4" />, description: 'Catégories et workflows' },
    ],
  },
  {
    id: 'commercial',
    label: 'Finance & Commercial',
    sections: [
      { id: 'contracts', label: 'Types de contrats', icon: <FileText className="h-4 w-4" />, description: 'Modèles de contrats' },
      { id: 'skills', label: 'Compétences & Taux', icon: <UserCog className="h-4 w-4" />, description: 'Rôles et tarification' },
      { id: 'templates', label: 'Templates de devis', icon: <Grid3X3 className="h-4 w-4" />, description: 'Phases prédéfinies' },
      { id: 'pricing', label: 'Grilles tarifaires', icon: <Euro className="h-4 w-4" />, description: 'BPU et prix' },
      { id: 'quote-themes', label: 'Thèmes de devis', icon: <Palette className="h-4 w-4" />, description: 'Styles visuels', badge: 'Nouveau' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    sections: [
      { id: 'documents', label: 'Configuration', icon: <FileStack className="h-4 w-4" />, description: 'Types et templates' },
      { id: 'emails', label: 'Emails', icon: <Mail className="h-4 w-4" />, description: 'Templates email' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    sections: [
      { id: 'crm', label: 'Pipeline', icon: <Target className="h-4 w-4" />, description: 'Étapes de prospection' },
    ],
  },
  {
    id: 'feedback',
    label: 'Feedback',
    sections: [
      { id: 'feedback', label: 'Retours utilisateurs', icon: <MessageSquarePlus className="h-4 w-4" />, description: 'Suggestions et bugs' },
    ],
  },
];

interface SettingsLayoutProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  children: ReactNode;
}

export function SettingsLayout({ activeSection, onSectionChange, children }: SettingsLayoutProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get the current section info
  const currentSection = SETTINGS_GROUPS.flatMap(g => g.sections).find(s => s.id === activeSection);

  // Filter sections based on search
  const filteredGroups = SETTINGS_GROUPS.map(group => ({
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
