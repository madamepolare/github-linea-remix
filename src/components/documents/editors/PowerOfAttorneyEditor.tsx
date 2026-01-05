import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Contact {
  id: string;
  name: string;
  role?: string | null;
}

interface PowerOfAttorneyEditorProps {
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
  contacts: Contact[];
}

export function PowerOfAttorneyEditor({ content, onChange, contacts }: PowerOfAttorneyEditorProps) {
  const updateField = (key: string, value: unknown) => {
    onChange({ ...content, [key]: value });
  };

  const specificPowers = (content.specific_powers as string[]) || [];

  const addPower = () => {
    updateField('specific_powers', [...specificPowers, '']);
  };

  const removePower = (index: number) => {
    updateField('specific_powers', specificPowers.filter((_, i) => i !== index));
  };

  const updatePower = (index: number, value: string) => {
    const updated = [...specificPowers];
    updated[index] = value;
    updateField('specific_powers', updated);
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Délégant (celui qui donne le pouvoir)</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nom complet</Label>
          <Input
            value={(content.delegator_name as string) || ''}
            onChange={(e) => updateField('delegator_name', e.target.value)}
            placeholder="Nom du délégant"
          />
        </div>
        <div className="space-y-2">
          <Label>Fonction</Label>
          <Input
            value={(content.delegator_role as string) || ''}
            onChange={(e) => updateField('delegator_role', e.target.value)}
            placeholder="Ex: Gérant, Directeur..."
          />
        </div>
      </div>

      <h4 className="font-medium pt-4">Délégataire (celui qui reçoit le pouvoir)</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sélectionner un contact</Label>
          <Select
            value={(content.delegate_contact_id as string) || undefined}
            onValueChange={(value) => {
              const contact = contacts.find(c => c.id === value);
              updateField('delegate_contact_id', value);
              if (contact) {
                updateField('delegate_name', contact.name);
                updateField('delegate_role', contact.role || '');
              }
            }}
          >
          <SelectTrigger>
              <SelectValue placeholder="Choisir un contact" />
            </SelectTrigger>
            <SelectContent>
              {contacts.filter(c => c.id).length === 0 ? (
                <SelectItem value="_empty" disabled>Aucun contact disponible</SelectItem>
              ) : (
                contacts.filter(c => c.id).map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ou saisir manuellement</Label>
          <Input
            value={(content.delegate_name as string) || ''}
            onChange={(e) => updateField('delegate_name', e.target.value)}
            placeholder="Nom du délégataire"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fonction du délégataire</Label>
        <Input
          value={(content.delegate_role as string) || ''}
          onChange={(e) => updateField('delegate_role', e.target.value)}
          placeholder="Ex: Chef de projet, Architecte..."
        />
      </div>

      <h4 className="font-medium pt-4">Portée du pouvoir</h4>

      <div className="space-y-2">
        <Label>Description générale</Label>
        <Textarea
          value={(content.scope as string) || ''}
          onChange={(e) => updateField('scope', e.target.value)}
          placeholder="Décrire l'étendue générale des pouvoirs délégués..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Pouvoirs spécifiques</Label>
          <Button variant="outline" size="sm" onClick={addPower}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {specificPowers.map((power, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={power}
              onChange={(e) => updatePower(index, e.target.value)}
              placeholder={`Pouvoir ${index + 1}`}
            />
            <Button variant="ghost" size="icon" onClick={() => removePower(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <h4 className="font-medium pt-4">Période de validité</h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Input
            type="date"
            value={(content.start_date as string) || ''}
            onChange={(e) => updateField('start_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Input
            type="date"
            value={(content.end_date as string) || ''}
            onChange={(e) => updateField('end_date', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
