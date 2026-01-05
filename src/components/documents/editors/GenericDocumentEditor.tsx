import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from '@/lib/documentTypes';

interface GenericDocumentEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  documentType: DocumentType;
}

// Field definitions per document type
const DOCUMENT_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'textarea' | 'date' | 'number' }[]> = {
  attestation_insurance: [
    { key: 'insurance_company', label: 'Compagnie d\'assurance', type: 'text' },
    { key: 'policy_number', label: 'Numéro de police', type: 'text' },
    { key: 'coverage_type', label: 'Type de couverture', type: 'text' },
    { key: 'coverage_amount', label: 'Montant de couverture', type: 'number' },
    { key: 'start_date', label: 'Date de début', type: 'date' },
    { key: 'end_date', label: 'Date de fin', type: 'date' },
    { key: 'activities_covered', label: 'Activités couvertes', type: 'textarea' },
  ],
  attestation_fiscal: [
    { key: 'tax_period', label: 'Période fiscale', type: 'text' },
    { key: 'tax_office', label: 'Centre des impôts', type: 'text' },
    { key: 'tax_number', label: 'Numéro fiscal', type: 'text' },
    { key: 'issue_date', label: 'Date d\'émission', type: 'date' },
    { key: 'status', label: 'Situation', type: 'textarea' },
  ],
  attestation_urssaf: [
    { key: 'urssaf_number', label: 'Numéro URSSAF', type: 'text' },
    { key: 'urssaf_center', label: 'Centre URSSAF', type: 'text' },
    { key: 'period', label: 'Période concernée', type: 'text' },
    { key: 'issue_date', label: 'Date de délivrance', type: 'date' },
    { key: 'employees_count', label: 'Nombre de salariés', type: 'number' },
  ],
  attestation_capacity: [
    { key: 'capacity_type', label: 'Type de capacité', type: 'text' },
    { key: 'financial_amount', label: 'Montant financier', type: 'number' },
    { key: 'bank_name', label: 'Établissement bancaire', type: 'text' },
    { key: 'issue_date', label: 'Date d\'émission', type: 'date' },
    { key: 'validity_period', label: 'Période de validité', type: 'text' },
  ],
  certificate: [
    { key: 'certificate_type', label: 'Type de certificat', type: 'text' },
    { key: 'issued_to', label: 'Délivré à', type: 'text' },
    { key: 'issued_by', label: 'Délivré par', type: 'text' },
    { key: 'issue_date', label: 'Date de délivrance', type: 'date' },
    { key: 'content', label: 'Contenu du certificat', type: 'textarea' },
  ],
  amendment: [
    { key: 'amendment_number', label: 'Numéro d\'avenant', type: 'number' },
    { key: 'original_contract', label: 'Contrat d\'origine', type: 'text' },
    { key: 'original_date', label: 'Date du contrat', type: 'date' },
    { key: 'reason', label: 'Motif de l\'avenant', type: 'textarea' },
    { key: 'modifications', label: 'Modifications apportées', type: 'textarea' },
    { key: 'new_total', label: 'Nouveau montant total', type: 'number' },
    { key: 'effective_date', label: 'Date d\'effet', type: 'date' },
  ],
  formal_notice: [
    { key: 'recipient_name', label: 'Destinataire', type: 'text' },
    { key: 'recipient_address', label: 'Adresse', type: 'textarea' },
    { key: 'subject', label: 'Objet', type: 'text' },
    { key: 'context', label: 'Contexte / Rappel des faits', type: 'textarea' },
    { key: 'claims', label: 'Demandes / Réclamations', type: 'textarea' },
    { key: 'deadline', label: 'Délai accordé', type: 'text' },
    { key: 'consequences', label: 'Conséquences en cas de non-réponse', type: 'textarea' },
  ],
  validation_letter: [
    { key: 'recipient_name', label: 'Destinataire', type: 'text' },
    { key: 'subject', label: 'Objet', type: 'text' },
    { key: 'validated_items', label: 'Éléments validés', type: 'textarea' },
    { key: 'conditions', label: 'Conditions / Réserves', type: 'textarea' },
    { key: 'next_steps', label: 'Prochaines étapes', type: 'textarea' },
  ],
  refusal_letter: [
    { key: 'recipient_name', label: 'Destinataire', type: 'text' },
    { key: 'subject', label: 'Objet', type: 'text' },
    { key: 'refused_items', label: 'Éléments refusés', type: 'textarea' },
    { key: 'reasons', label: 'Motifs du refus', type: 'textarea' },
    { key: 'alternatives', label: 'Alternatives proposées', type: 'textarea' },
  ],
  site_visit_report: [
    { key: 'visit_date', label: 'Date de visite', type: 'date' },
    { key: 'location', label: 'Lieu', type: 'text' },
    { key: 'participants', label: 'Participants', type: 'textarea' },
    { key: 'purpose', label: 'Objet de la visite', type: 'text' },
    { key: 'observations', label: 'Observations', type: 'textarea' },
    { key: 'conclusions', label: 'Conclusions', type: 'textarea' },
    { key: 'actions_required', label: 'Actions à mener', type: 'textarea' },
  ],
  employer_certificate: [
    { key: 'employee_name', label: 'Nom du salarié', type: 'text' },
    { key: 'employee_role', label: 'Fonction', type: 'text' },
    { key: 'start_date', label: 'Date d\'embauche', type: 'date' },
    { key: 'contract_type', label: 'Type de contrat', type: 'text' },
    { key: 'salary', label: 'Rémunération (optionnel)', type: 'number' },
    { key: 'purpose', label: 'Motif de l\'attestation', type: 'text' },
  ],
  expense_report: [
    { key: 'employee_name', label: 'Nom du salarié', type: 'text' },
    { key: 'period_start', label: 'Période du', type: 'date' },
    { key: 'period_end', label: 'Au', type: 'date' },
    { key: 'total_amount', label: 'Montant total', type: 'number' },
    { key: 'advance_received', label: 'Acompte reçu', type: 'number' },
    { key: 'amount_due', label: 'Reste à rembourser', type: 'number' },
    { key: 'details', label: 'Détail des frais', type: 'textarea' },
  ],
  mission_order: [
    { key: 'employee_name', label: 'Nom du collaborateur', type: 'text' },
    { key: 'employee_role', label: 'Fonction', type: 'text' },
    { key: 'destination', label: 'Destination', type: 'text' },
    { key: 'departure_date', label: 'Date de départ', type: 'date' },
    { key: 'return_date', label: 'Date de retour', type: 'date' },
    { key: 'mission_purpose', label: 'Objet de la mission', type: 'textarea' },
    { key: 'transport_mode', label: 'Mode de transport', type: 'text' },
    { key: 'accommodation', label: 'Hébergement', type: 'text' },
    { key: 'budget_estimate', label: 'Budget prévisionnel', type: 'number' },
  ],
  training_certificate: [
    { key: 'trainee_name', label: 'Nom du stagiaire', type: 'text' },
    { key: 'training_title', label: 'Intitulé de la formation', type: 'text' },
    { key: 'training_provider', label: 'Organisme de formation', type: 'text' },
    { key: 'start_date', label: 'Date de début', type: 'date' },
    { key: 'end_date', label: 'Date de fin', type: 'date' },
    { key: 'duration_hours', label: 'Durée (heures)', type: 'number' },
    { key: 'skills_acquired', label: 'Compétences acquises', type: 'textarea' },
  ],
};

export function GenericDocumentEditor({ content, onChange, documentType }: GenericDocumentEditorProps) {
  const updateField = (key: string, value: unknown) => {
    onChange({ ...content, [key]: value });
  };

  const fields = DOCUMENT_FIELDS[documentType] || [
    { key: 'content', label: 'Contenu', type: 'textarea' as const },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">{DOCUMENT_TYPE_LABELS[documentType]}</h4>
      
      {fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          {field.type === 'textarea' ? (
            <Textarea
              id={field.key}
              value={(content[field.key] as string) || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              id={field.key}
              type={field.type}
              value={(content[field.key] as string | number) || ''}
              onChange={(e) => updateField(field.key, 
                field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
