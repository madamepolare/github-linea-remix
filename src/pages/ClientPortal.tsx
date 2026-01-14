import { useParams } from 'react-router-dom';
import { useClientPortal } from '@/hooks/useClientPortal';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { PortalProjects } from '@/components/portal/PortalProjects';
import { PortalTasks } from '@/components/portal/PortalTasks';
import { PortalQuotes } from '@/components/portal/PortalQuotes';
import { PortalInvoices } from '@/components/portal/PortalInvoices';
import { PortalTimeEntries } from '@/components/portal/PortalTimeEntries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, FolderOpen, ListTodo, FileText, Receipt, Clock } from 'lucide-react';
import { useState } from 'react';

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error, createRequest, refresh } = useClientPortal(token);
  const [activeTab, setActiveTab] = useState('projects');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement du portail...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-semibold">Accès non disponible</h1>
          <p className="text-muted-foreground">
            {error || 'Ce lien de portail est invalide ou a expiré.'}
          </p>
        </div>
      </div>
    );
  }

  const { portal, workspace, contact, projects, tasks, requests, quotes, invoices, time_entries, time_summary } = data;
  const permissions = portal.permissions;

  // Determine available tabs
  const availableTabs: { key: string; label: string; icon: any }[] = [];
  if (permissions.can_view_projects) {
    availableTabs.push({ key: 'projects', label: 'Projets', icon: FolderOpen });
  }
  if (permissions.can_view_tasks) {
    availableTabs.push({ key: 'tasks', label: 'Demandes', icon: ListTodo });
  }
  if (permissions.can_view_quotes) {
    availableTabs.push({ key: 'quotes', label: 'Devis', icon: FileText });
  }
  if (permissions.can_view_invoices) {
    availableTabs.push({ key: 'invoices', label: 'Factures', icon: Receipt });
  }
  if (permissions.can_view_time_entries) {
    availableTabs.push({ key: 'time', label: 'Temps passés', icon: Clock });
  }

  // Set initial tab if current is not available
  const defaultTab = availableTabs[0]?.key || 'projects';

  return (
    <div className="min-h-screen bg-muted/30">
      <PortalHeader 
        workspace={workspace} 
        contact={contact} 
      />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-background border w-full justify-start overflow-x-auto">
            {availableTabs.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {permissions.can_view_projects && (
            <TabsContent value="projects" className="m-0">
              <PortalProjects projects={projects || []} />
            </TabsContent>
          )}

          {permissions.can_view_tasks && (
            <TabsContent value="tasks" className="m-0">
              <PortalTasks 
                tasks={tasks || []} 
                requests={requests || []}
                projects={projects || []}
                canAddTasks={permissions.can_add_tasks}
                onCreateRequest={createRequest}
              />
            </TabsContent>
          )}

          {permissions.can_view_quotes && (
            <TabsContent value="quotes" className="m-0">
              <PortalQuotes quotes={quotes || []} token={token!} />
            </TabsContent>
          )}

          {permissions.can_view_invoices && (
            <TabsContent value="invoices" className="m-0">
              <PortalInvoices invoices={invoices || []} />
            </TabsContent>
          )}

          {permissions.can_view_time_entries && (
            <TabsContent value="time" className="m-0">
              <PortalTimeEntries 
                timeEntries={time_entries || []} 
                summary={time_summary}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="border-t bg-background mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Portail client propulsé par {workspace.name}
        </div>
      </footer>
    </div>
  );
}
