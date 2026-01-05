import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from '@/lib/documentTypes';
import { useAgencyInfo } from '@/hooks/useAgencyInfo';

interface LiveDocumentPreviewProps {
  documentType: DocumentType;
  documentNumber: string;
  title: string;
  content: Record<string, unknown>;
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
  scale = 1,
}: LiveDocumentPreviewProps) {
  const { agencyInfo, getFullAddress, getLegalInfo } = useAgencyInfo();
  const formattedDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  const renderValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Non renseigné</span>;
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
        <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {value.map((item, i) => (
            <li key={i}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
          return format(new Date(value), 'dd MMMM yyyy', { locale: fr });
        } catch {
          return value;
        }
      }
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
      style={{
        width: '210mm',
        minHeight: '297mm',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        color: '#18181b',
        position: 'relative',
      }}
    >
      {/* En-tête minimaliste noir et blanc */}
      <header 
        style={{
          padding: '40px 48px 32px',
          borderBottom: '1px solid #e4e4e7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {/* Logo et nom de l'agence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {agencyInfo?.logo_url ? (
            <div 
              style={{
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img 
                src={agencyInfo.logo_url} 
                alt={agencyInfo.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : null}
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              margin: 0, 
              letterSpacing: '-0.025em',
              color: '#18181b',
            }}>
              {agencyInfo?.name || 'DOMINI'}
            </h2>
            {getFullAddress() && (
              <p style={{ 
                fontSize: '11px', 
                margin: '4px 0 0', 
                color: '#71717a', 
                whiteSpace: 'pre-line', 
                lineHeight: 1.5,
              }}>
                {getFullAddress()}
              </p>
            )}
          </div>
        </div>

        {/* Infos de contact */}
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#71717a' }}>
          {agencyInfo?.phone && (
            <p style={{ margin: '0 0 2px' }}>{agencyInfo.phone}</p>
          )}
          {agencyInfo?.email && (
            <p style={{ margin: '0 0 2px' }}>{agencyInfo.email}</p>
          )}
          {agencyInfo?.website && (
            <p style={{ margin: 0 }}>{agencyInfo.website}</p>
          )}
        </div>
      </header>

      {/* Type de document et numéro */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 48px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #e4e4e7',
        }}
      >
        <span 
          style={{
            fontSize: '10px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#52525b',
          }}
        >
          {DOCUMENT_TYPE_LABELS[documentType] || documentType}
        </span>
        <div style={{ textAlign: 'right' }}>
          <span 
            style={{
              fontSize: '11px',
              fontWeight: '500',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              color: '#3f3f46',
            }}
          >
            {documentNumber || 'N° ---'}
          </span>
          <span style={{ 
            fontSize: '11px', 
            color: '#a1a1aa', 
            marginLeft: '16px',
          }}>
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Corps du document */}
      <div style={{ padding: '48px', minHeight: '540px' }}>
        {/* Titre du document */}
        <h1 
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#18181b',
            margin: '0 0 40px',
            lineHeight: 1.3,
            letterSpacing: '-0.025em',
          }}
        >
          {title || 'Sans titre'}
        </h1>

        {/* Contenu */}
        <div style={{ marginTop: '24px' }}>
          {!hasContent ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#a1a1aa' }}>
              <svg 
                style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <p style={{ fontSize: '14px', margin: 0 }}>Commencez à remplir le formulaire</p>
              <p style={{ fontSize: '12px', margin: '8px 0 0', opacity: 0.7 }}>Le contenu apparaîtra ici en temps réel</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {contentFields.map(({ key, label, value }) => (
                <div key={key} style={{ pageBreakInside: 'avoid' }}>
                  <dt 
                    style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#71717a',
                      marginBottom: '8px',
                    }}
                  >
                    {label}
                  </dt>
                  <dd 
                    style={{
                      fontSize: '13px',
                      color: '#27272a',
                      lineHeight: 1.7,
                      margin: 0,
                      paddingLeft: '16px',
                      borderLeft: '2px solid #e4e4e7',
                    }}
                  >
                    {renderValue(key, value)}
                  </dd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zone de signature */}
        <div style={{ marginTop: '64px', paddingTop: '32px' }}>
          <p style={{ fontSize: '12px', color: '#52525b', fontStyle: 'italic', marginBottom: '32px' }}>
            Fait pour servir et valoir ce que de droit.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', fontWeight: '500', color: '#52525b', marginBottom: '16px' }}>
                Signature
              </p>
              {agencyInfo?.signature_url ? (
                <div style={{ marginBottom: '8px' }}>
                  <img 
                    src={agencyInfo.signature_url} 
                    alt="Signature" 
                    style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div style={{ height: '48px', marginBottom: '8px' }} />
              )}
              <div style={{ width: '180px', borderBottom: '1px solid #d4d4d8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <footer 
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 48px',
          borderTop: '1px solid #e4e4e7',
          textAlign: 'center',
        }}
      >
        {getLegalInfo() && (
          <p style={{ fontSize: '8px', color: '#71717a', margin: '0 0 4px', letterSpacing: '0.02em' }}>
            {getLegalInfo()}
          </p>
        )}
        {agencyInfo?.footer_text && (
          <p style={{ fontSize: '8px', color: '#a1a1aa', margin: 0 }}>
            {agencyInfo.footer_text}
          </p>
        )}
      </footer>
    </div>
  );
}