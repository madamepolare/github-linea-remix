import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Building2, MapPin, Ruler, Euro } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConvertLead } from '@/hooks/useConvertLead';

interface Lead {
  id: string;
  title: string;
  description?: string | null;
  estimated_value?: number | null;
  crm_company?: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
  } | null;
  contact?: {
    id: string;
    name: string;
  } | null;
}

interface ConvertLeadToProjectDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | undefined;
}

const PROJECT_TYPES = [
  { value: 'residential', label: 'Résidentiel' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'public', label: 'Public' },
  { value: 'industrial', label: 'Industriel' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'interior', label: 'Architecture intérieure' },
  { value: 'urban', label: 'Urbanisme' },
  { value: 'other', label: 'Autre' },
];

export function ConvertLeadToProjectDialog({ 
  lead, 
  open, 
  onOpenChange,
  workspaceId 
}: ConvertLeadToProjectDialogProps) {
  const navigate = useNavigate();
  const convertLead = useConvertLead(workspaceId);

  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'residential',
    description: '',
    address: '',
    city: '',
    postalCode: '',
    surface: '',
    budget: '',
  });

  // Pre-fill form when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        projectName: lead.title || '',
        projectType: 'residential',
        description: lead.description || '',
        address: lead.crm_company?.address || '',
        city: lead.crm_company?.city || '',
        postalCode: lead.crm_company?.postal_code || '',
        surface: '',
        budget: lead.estimated_value?.toString() || '',
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      const project = await convertLead.mutateAsync({
        leadId: lead.id,
        projectName: formData.projectName,
        projectType: formData.projectType,
        description: formData.description || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        postalCode: formData.postalCode || undefined,
        surface: formData.surface ? parseFloat(formData.surface) : undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
      });

      onOpenChange(false);
      navigate(`/projects/${project.id}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Convertir en projet
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau projet à partir des informations du lead "{lead?.title}".
            Vous pourrez modifier ces informations après la création.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company info */}
          {lead?.crm_company && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Client : <strong>{lead.crm_company.name}</strong>
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="projectName">Nom du projet *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="Ex: Villa Moderna"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType">Type de projet *</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => setFormData({ ...formData, projectType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="flex items-center gap-1">
                <Euro className="h-3 w-3" />
                Budget estimé
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ex: 500000"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Adresse du projet
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: 123 rue de l'Architecture"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Paris"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="Ex: 75001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface" className="flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                Surface (m²)
              </Label>
              <Input
                id="surface"
                type="number"
                value={formData.surface}
                onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                placeholder="Ex: 250"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du projet..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={convertLead.isPending}>
              {convertLead.isPending ? 'Conversion...' : 'Créer le projet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
