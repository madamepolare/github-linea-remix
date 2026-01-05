import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from '@/lib/documentTypes';

interface LiveDocumentPreviewProps {
  documentType: DocumentType;
  documentNumber: string;
  title: string;
  content: Record<string, unknown>;
  agencyName?: string;
  agencyAddress?: string;
  scale?: number;
}

const FIELD_LABELS: Record<string, string> = {
  delegator_name: 'Délégant',
  delegator_role: 'En qualité de',
  delegate_name: 'Délégataire',
  delegate_role: 'En qualité de',
  scope: 'Étendue des pouvoirs',
  specific_powers: 'Pouvoirs spécifiques',
  start_date: 'Date de début',
  end_date: 'Date de fin',
  insurance_company: 'Compagnie d\'assurance',
  policy_number: 'N° de police',
  coverage_type: 'Type de couverture',
  coverage_amount: 'Montant de couverture',
  activities_covered: 'Activités couvertes',
  order_type: 'Type d\'ordre',
  project_name: 'Projet',
  project_address: 'Adresse du projet',
  client_name: 'Client',
  effective_date: 'Date d\'effet',
  phase_name: 'Phase',
  instructions: 'Instructions',
  recipient_name: 'Destinataire',
  recipient_address: 'Adresse',
  subject: 'Objet',
  context: 'Contexte',
  claims: 'Demandes',
  deadline: 'Délai',
  consequences: 'Conséquences',
  visit_date: 'Date de visite',
  location: 'Lieu',
  participants: 'Participants',
  purpose: 'Objet',
  observations: 'Observations',
  conclusions: 'Conclusions',
  actions_required: 'Actions à mener',
  employee_name: 'Nom',
  employee_role: 'Fonction',
  contract_type: 'Type de contrat',
  training_title: 'Formation',
  training_provider: 'Organisme',
  duration_hours: 'Durée (heures)',
  skills_acquired: 'Compétences acquises',
  total_amount: 'Montant total',
  details: 'Détail',
  content: 'Contenu',
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  start: 'Ordre de démarrage',
  suspend: 'Ordre de suspension',
  resume: 'Ordre de reprise',
  stop: 'Ordre d\'arrêt',
};

export function LiveDocumentPreview({
  documentType,
  documentNumber,
  title,
  content,
  agencyName = 'Votre Agence',
  agencyAddress = '',
  scale = 1,
}: LiveDocumentPreviewProps) {
  const formattedDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  const renderValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground/50 italic">Non renseigné</span>;
    }

    if (key === 'order_type' && typeof value === 'string') {
      return ORDER_TYPE_LABELS[value] || value;
    }

    if (typeof value === 'number') {
      if (key.includes('amount') || key.includes('total') || key.includes('budget') || key.includes('coverage')) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
      }
      return value.toString();
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, i) => (
            <li key={i}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'string') {
      // Check if it's a date
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
          return format(new Date(value), 'dd MMMM yyyy', { locale: fr });
        } catch {
          return value;
        }
      }
      // Multi-line text
      if (value.includes('\n')) {
        return value.split('\n').map((line, i) => (
          <span key={i}>
            {line}
            {i < value.split('\n').length - 1 && <br />}
          </span>
        ));
      }
      return value;
    }

    return String(value);
  };

  const contentFields = useMemo(() => {
    return Object.entries(content)
      .filter(([key, value]) => {
        if (key.endsWith('_id')) return false;
        if (value === null || value === undefined) return false;
        return true;
      })
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
      }));
  }, [content]);

  const hasContent = contentFields.some(f => f.value !== '' && f.value !== null && f.value !== undefined);

  return (
    <div 
      className="bg-white text-black shadow-2xl rounded-sm overflow-hidden"
      style={{
        width: '210mm',
        minHeight: '297mm',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* Document content */}
      <div className="p-12 min-h-[297mm] flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-start mb-12 pb-6 border-b-2 border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{agencyName}</h2>
            {agencyAddress && (
              <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{agencyAddress}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
              {documentNumber || 'N° ---'}
            </p>
            <p className="text-sm text-gray-500 mt-2">{formattedDate}</p>
          </div>
        </header>

        {/* Document type badge */}
        <div className="mb-8">
          <span className="inline-block text-xs uppercase tracking-widest text-primary font-semibold bg-primary/10 px-4 py-2 rounded-full">
            {DOCUMENT_TYPE_LABELS[documentType] || documentType}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-10 leading-tight">
          {title || 'Sans titre'}
        </h1>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {!hasContent ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">Commencez à remplir le formulaire</p>
              <p className="text-sm mt-1">Le contenu apparaîtra ici en temps réel</p>
            </div>
          ) : (
            <div className="space-y-6">
              {contentFields.map(({ key, label, value }) => (
                <div key={key} className="group">
                  <dt className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">
                    {label}
                  </dt>
                  <dd className="text-base text-gray-800 leading-relaxed pl-0">
                    {renderValue(key, value)}
                  </dd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signature area */}
        <div className="mt-auto pt-12">
          <p className="text-sm text-gray-600 italic mb-8">
            Fait pour servir et valoir ce que de droit.
          </p>
          <div className="flex justify-end">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-12">Signature</p>
              <div className="w-48 border-b-2 border-gray-400"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Document généré le {formattedDate}
          </p>
        </footer>
      </div>
    </div>
  );
}
