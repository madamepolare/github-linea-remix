import { useParams } from 'react-router-dom';
import { useCompanyPortal } from '@/hooks/useCompanyPortal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyPortalHeader } from '@/components/portal/CompanyPortalHeader';
import { PortalProjects } from '@/components/portal/PortalProjects';
import { PortalTasks } from '@/components/portal/PortalTasks';
import { PortalQuotes } from '@/components/portal/PortalQuotes';
import { PortalInvoices } from '@/components/portal/PortalInvoices';
import { PortalTimeEntries } from '@/components/portal/PortalTimeEntries';
import { CompanyPortalContacts } from '@/components/portal/CompanyPortalContacts';
import { Loader2, AlertCircle } from 'lucide-react';

export default function CompanyPortal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error, createRequest } = useCompanyPortal(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Chargement du portail...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Accès non disponible</h1>
          <p className="mt-2 text-muted-foreground">
            {error || 'Ce lien de portail est invalide ou a expiré.'}
          </p>
        </div>
      </div>
    );
  }

  const { portal, workspace, company, projects, tasks, requests, quotes, invoices, time_entries, time_entries_summary, contacts } = data;
  const permissions = portal.permissions;

  // Determine available tabs
  const availableTabs: string[] = [];
  if (permissions.can_view_projects) availableTabs.push('projects');
  if (permissions.can_view_tasks) availableTabs.push('tasks');
  if (permissions.can_view_quotes) availableTabs.push('quotes');
  if (permissions.can_view_invoices) availableTabs.push('invoices');
  if (permissions.can_view_time_entries) availableTabs.push('time');
  if (permissions.can_view_contacts) availableTabs.push('contacts');

  const defaultTab = availableTabs[0] || 'projects';

  return (
    <div className="min-h-screen bg-muted/30">
      <CompanyPortalHeader workspace={workspace} company={company} />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2 p-1">
            {permissions.can_view_projects && (
              <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Projets
              </TabsTrigger>
            )}
            {permissions.can_view_tasks && (
              <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Tâches
              </TabsTrigger>
            )}
            {permissions.can_view_quotes && (
              <TabsTrigger value="quotes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Devis
              </TabsTrigger>
            )}
            {permissions.can_view_invoices && (
              <TabsTrigger value="invoices" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Factures
              </TabsTrigger>
            )}
            {permissions.can_view_time_entries && (
              <TabsTrigger value="time" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Temps
              </TabsTrigger>
            )}
            {permissions.can_view_contacts && (
              <TabsTrigger value="contacts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Contacts
              </TabsTrigger>
            )}
          </TabsList>

          {permissions.can_view_projects && (
            <TabsContent value="projects">
              <PortalProjects projects={projects as any || []} />
            </TabsContent>
          )}

          {permissions.can_view_tasks && (
            <TabsContent value="tasks">
              <PortalTasks
                tasks={tasks as any || []}
                requests={requests as any || []}
                projects={projects as any || []}
                canAddTasks={permissions.can_add_tasks}
                onCreateRequest={(title, description, projectId) => 
                  createRequest({ title, description, project_id: projectId })
                }
              />
            </TabsContent>
          )}

          {permissions.can_view_quotes && (
            <TabsContent value="quotes">
              <PortalQuotes quotes={quotes as any || []} token={token || ''} />
            </TabsContent>
          )}

          {permissions.can_view_invoices && (
            <TabsContent value="invoices">
              <PortalInvoices invoices={invoices as any || []} />
            </TabsContent>
          )}

          {permissions.can_view_time_entries && (
            <TabsContent value="time">
              <PortalTimeEntries
                timeEntries={time_entries as any || []}
                summary={time_entries_summary}
              />
            </TabsContent>
          )}

          {permissions.can_view_contacts && (
            <TabsContent value="contacts">
              <CompanyPortalContacts contacts={contacts || []} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>Portail propulsé par {workspace.name}</p>
      </footer>
    </div>
  );
}
