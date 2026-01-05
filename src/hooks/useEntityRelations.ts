import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EntityType = 'project' | 'lead' | 'company' | 'contact' | 'tender' | 'invoice' | 'document';

interface RelatedEntity {
  id: string;
  type: EntityType;
  name: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface EntityRelations {
  lead?: RelatedEntity;
  project?: RelatedEntity;
  company?: RelatedEntity;
  contact?: RelatedEntity;
  tender?: RelatedEntity;
  leads: RelatedEntity[];
  projects: RelatedEntity[];
  invoices: RelatedEntity[];
  commercialDocuments: RelatedEntity[];
  contacts: RelatedEntity[];
  tenders: RelatedEntity[];
}

export function useEntityRelations(entityType: EntityType, entityId: string | undefined, workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['entity-relations', entityType, entityId, workspaceId],
    queryFn: async (): Promise<EntityRelations> => {
      if (!entityId || !workspaceId) {
        return {
          leads: [],
          projects: [],
          invoices: [],
          commercialDocuments: [],
          contacts: [],
          tenders: [],
        };
      }

      const relations: EntityRelations = {
        leads: [],
        projects: [],
        invoices: [],
        commercialDocuments: [],
        contacts: [],
        tenders: [],
      };

      // Fetch based on entity type
      if (entityType === 'project') {
        // Get project details with lead
        const { data: project } = await supabase
          .from('projects')
          .select('*, lead:leads(id, title, status, estimated_value), crm_company:crm_companies(id, name)')
          .eq('id', entityId)
          .single();

        if (project?.lead) {
          relations.lead = {
            id: project.lead.id,
            type: 'lead',
            name: project.lead.title,
            status: project.lead.status,
            metadata: { estimated_value: project.lead.estimated_value }
          };
        }

        if (project?.crm_company) {
          relations.company = {
            id: project.crm_company.id,
            type: 'company',
            name: project.crm_company.name,
          };
        }

        // Get invoices for project
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, total_ttc')
          .eq('project_id', entityId);

        relations.invoices = (invoices || []).map(inv => ({
          id: inv.id,
          type: 'invoice' as EntityType,
          name: inv.invoice_number,
          status: inv.status,
          metadata: { total: inv.total_ttc }
        }));

        // Get commercial documents for project
        const { data: docs } = await supabase
          .from('commercial_documents')
          .select('id, document_number, document_type, status, total_amount')
          .eq('project_id', entityId);

        relations.commercialDocuments = (docs || []).map(doc => ({
          id: doc.id,
          type: 'document' as EntityType,
          name: doc.document_number,
          status: doc.status,
          metadata: { type: doc.document_type, total: doc.total_amount }
        }));

        // Get tenders for project
        const { data: tenders } = await supabase
          .from('tenders')
          .select('id, title, status')
          .eq('project_id', entityId);

        relations.tenders = (tenders || []).map(t => ({
          id: t.id,
          type: 'tender' as EntityType,
          name: t.title,
          status: t.status,
        }));
      }

      if (entityType === 'lead') {
        // Get lead details with project
        const { data: lead } = await supabase
          .from('leads')
          .select('*, project:projects(id, name, status), crm_company:crm_companies(id, name), contact:contacts(id, name)')
          .eq('id', entityId)
          .single();

        if (lead?.project) {
          relations.project = {
            id: lead.project.id,
            type: 'project',
            name: lead.project.name,
            status: lead.project.status,
          };
        }

        if (lead?.crm_company) {
          relations.company = {
            id: lead.crm_company.id,
            type: 'company',
            name: lead.crm_company.name,
          };
        }

        if (lead?.contact) {
          relations.contact = {
            id: lead.contact.id,
            type: 'contact',
            name: lead.contact.name,
          };
        }

        // Get commercial documents for lead's company
        if (lead?.crm_company_id) {
          const { data: docs } = await supabase
            .from('commercial_documents')
            .select('id, document_number, document_type, status, total_amount')
            .eq('client_company_id', lead.crm_company_id);

          relations.commercialDocuments = (docs || []).map(doc => ({
            id: doc.id,
            type: 'document' as EntityType,
            name: doc.document_number,
            status: doc.status,
            metadata: { type: doc.document_type, total: doc.total_amount }
          }));
        }

        // Get tenders linked to this lead
        const { data: tenders } = await supabase
          .from('tenders')
          .select('id, title, status')
          .eq('lead_id', entityId);

        relations.tenders = (tenders || []).map(t => ({
          id: t.id,
          type: 'tender' as EntityType,
          name: t.title,
          status: t.status,
        }));
      }

      if (entityType === 'company') {
        // Get leads for company
        const { data: leads } = await supabase
          .from('leads')
          .select('id, title, status, estimated_value')
          .eq('crm_company_id', entityId);

        relations.leads = (leads || []).map(l => ({
          id: l.id,
          type: 'lead' as EntityType,
          name: l.title,
          status: l.status,
          metadata: { estimated_value: l.estimated_value }
        }));

        // Get projects for company
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, status')
          .eq('crm_company_id', entityId);

        relations.projects = (projects || []).map(p => ({
          id: p.id,
          type: 'project' as EntityType,
          name: p.name,
          status: p.status,
        }));

        // Get contacts for company
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, name, role')
          .eq('crm_company_id', entityId);

        relations.contacts = (contacts || []).map(c => ({
          id: c.id,
          type: 'contact' as EntityType,
          name: c.name,
          metadata: { role: c.role }
        }));

        // Get invoices for company
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, total_ttc')
          .eq('client_company_id', entityId);

        relations.invoices = (invoices || []).map(inv => ({
          id: inv.id,
          type: 'invoice' as EntityType,
          name: inv.invoice_number,
          status: inv.status,
          metadata: { total: inv.total_ttc }
        }));

        // Get commercial documents for company
        const { data: docs } = await supabase
          .from('commercial_documents')
          .select('id, document_number, document_type, status, total_amount')
          .eq('client_company_id', entityId);

        relations.commercialDocuments = (docs || []).map(doc => ({
          id: doc.id,
          type: 'document' as EntityType,
          name: doc.document_number,
          status: doc.status,
          metadata: { type: doc.document_type, total: doc.total_amount }
        }));
      }

      if (entityType === 'contact') {
        // Get contact with company
        const { data: contact } = await supabase
          .from('contacts')
          .select('*, crm_company:crm_companies(id, name)')
          .eq('id', entityId)
          .single();

        if (contact?.crm_company) {
          relations.company = {
            id: contact.crm_company.id,
            type: 'company',
            name: contact.crm_company.name,
          };
        }

        // Get leads for contact
        const { data: leads } = await supabase
          .from('leads')
          .select('id, title, status')
          .eq('contact_id', entityId);

        relations.leads = (leads || []).map(l => ({
          id: l.id,
          type: 'lead' as EntityType,
          name: l.title,
          status: l.status,
        }));

        // Get invoices for contact
        const { data: invoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, total_ttc')
          .eq('client_contact_id', entityId);

        relations.invoices = (invoices || []).map(inv => ({
          id: inv.id,
          type: 'invoice' as EntityType,
          name: inv.invoice_number,
          status: inv.status,
          metadata: { total: inv.total_ttc }
        }));
      }

      if (entityType === 'tender') {
        // Get tender with related entities
        const { data: tender } = await supabase
          .from('tenders')
          .select('*, lead:leads(id, title, status), project:projects(id, name, status)')
          .eq('id', entityId)
          .single();

        if (tender?.lead) {
          relations.lead = {
            id: tender.lead.id,
            type: 'lead',
            name: tender.lead.title,
            status: tender.lead.status,
          };
        }

        if (tender?.project) {
          relations.project = {
            id: tender.project.id,
            type: 'project',
            name: tender.project.name,
            status: tender.project.status,
          };
        }
      }

      return relations;
    },
    enabled: !!entityId && !!workspaceId,
  });
}
