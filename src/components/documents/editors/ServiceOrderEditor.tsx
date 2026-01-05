import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
  address?: string | null;
  client_name?: string | null;
}

interface ServiceOrderEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  projects: Project[];
}

const ORDER_TYPES = [
  { value: 'start', label: 'Démarrage des travaux' },
  { value: 'suspend', label: 'Suspension des travaux' },
  { value: 'resume', label: 'Reprise des travaux' },
  { value: 'stop', label: 'Arrêt définitif' },
];

export function ServiceOrderEditor({ content, onChange, projects }: ServiceOrderEditorProps) {
  const updateField = (key: string, value: unknown) => {
    onChange({ ...content, [key]: value });
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      updateField('project_id', projectId);
      updateField('project_name', project.name);
      updateField('project_address', project.address || '');
      updateField('client_name', project.client_name || '');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Type d'ordre de service</h4>
      
      <RadioGroup
        value={(content.order_type as string) || 'start'}
        onValueChange={(value) => updateField('order_type', value)}
        className="grid grid-cols-2 gap-4"
      >
        {ORDER_TYPES.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <RadioGroupItem value={type.value} id={type.value} />
            <Label htmlFor={type.value}>{type.label}</Label>
          </div>
        ))}
      </RadioGroup>

      <h4 className="font-medium pt-4">Projet concerné</h4>

      <div className="space-y-2">
        <Label>Sélectionner un projet</Label>
        <Select
          value={(content.project_id as string) || undefined}
          onValueChange={handleProjectChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un projet" />
          </SelectTrigger>
          <SelectContent>
            {projects.filter(p => p.id).length === 0 ? (
              <SelectItem value="_empty" disabled>Aucun projet disponible</SelectItem>
            ) : (
              projects.filter(p => p.id).map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom du projet</Label>
          <Input
            value={(content.project_name as string) || ''}
            onChange={(e) => updateField('project_name', e.target.value)}
            placeholder="Nom du projet"
          />
        </div>
        <div className="space-y-2">
          <Label>Client / Maître d'ouvrage</Label>
          <Input
            value={(content.client_name as string) || ''}
            onChange={(e) => updateField('client_name', e.target.value)}
            placeholder="Nom du client"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Adresse du chantier</Label>
        <Input
          value={(content.project_address as string) || ''}
          onChange={(e) => updateField('project_address', e.target.value)}
          placeholder="Adresse complète"
        />
      </div>

      <h4 className="font-medium pt-4">Détails de l'ordre</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date d'effet</Label>
          <Input
            type="date"
            value={(content.effective_date as string) || ''}
            onChange={(e) => updateField('effective_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Phase concernée</Label>
          <Input
            value={(content.phase_name as string) || ''}
            onChange={(e) => updateField('phase_name', e.target.value)}
            placeholder="Ex: Phase EXE, Chantier..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Instructions / Observations</Label>
        <Textarea
          value={(content.instructions as string) || ''}
          onChange={(e) => updateField('instructions', e.target.value)}
          placeholder="Instructions spécifiques, raisons, consignes..."
          rows={4}
        />
      </div>
    </div>
  );
}
