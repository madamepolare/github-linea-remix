import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileCheck,
  Calendar,
  Users,
  Download,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTenderDeliverables } from "@/hooks/useTenderDeliverables";
import { useTenderTeam } from "@/hooks/useTenderTeam";
import { DELIVERABLE_TYPES, REQUIRED_DOCUMENT_TYPES } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TenderLivrablesTabProps {
  tenderId: string;
}

// Responsible types
const RESPONSIBLE_TYPES = [
  { value: 'mandataire', label: 'Mandataire' },
  { value: 'tous', label: 'Tous les membres' },
  { value: 'cotraitant', label: 'Cotraitant' },
  { value: 'sous_traitant', label: 'Sous-traitant' },
];

export function TenderLivrablesTab({ tenderId }: TenderLivrablesTabProps) {
  const { deliverables, isLoading, addDeliverable, updateDeliverable, deleteDeliverable } = useTenderDeliverables(tenderId);
  const { teamMembers } = useTenderTeam(tenderId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({
    deliverable_type: '',
    name: '',
    responsible_type: 'mandataire',
    due_date: '',
  });

  // Calculate progress
  const completedCount = deliverables.filter(d => d.is_completed).length;
  const totalCount = deliverables.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check for missing mandatory documents
  const allMandatoryTypes = [
    ...REQUIRED_DOCUMENT_TYPES.candidature.filter(d => d.mandatory).map(d => d.value),
    ...REQUIRED_DOCUMENT_TYPES.offre.filter(d => d.mandatory).map(d => d.value),
  ];
  const existingTypes = deliverables.map(d => d.deliverable_type);
  const missingMandatory = allMandatoryTypes.filter(type => !existingTypes.includes(type));

  const handleAdd = () => {
    if (!newDeliverable.deliverable_type && !newDeliverable.name) {
      toast.error("Veuillez sélectionner un type ou saisir un nom");
      return;
    }

    const type = DELIVERABLE_TYPES.find(t => t.value === newDeliverable.deliverable_type);
    
    addDeliverable.mutate({
      deliverable_type: newDeliverable.deliverable_type || 'autre',
      name: newDeliverable.name || type?.label || 'Livrable',
      responsible_type: newDeliverable.responsible_type,
      due_date: newDeliverable.due_date || undefined,
    });
    
    setShowAddDialog(false);
    setNewDeliverable({
      deliverable_type: '',
      name: '',
      responsible_type: 'mandataire',
      due_date: '',
    });
  };

  const handleToggleComplete = (id: string, currentValue: boolean) => {
    updateDeliverable.mutate({ id, is_completed: !currentValue });
  };

  // Load default FR deliverables
  const handleLoadDefaults = () => {
    const allDefaults = [
      ...REQUIRED_DOCUMENT_TYPES.candidature.map(d => ({
        deliverable_type: d.value,
        name: d.label,
        responsible_type: 'mandataire',
        is_mandatory: d.mandatory,
      })),
      ...REQUIRED_DOCUMENT_TYPES.offre.map(d => ({
        deliverable_type: d.value,
        name: d.label,
        responsible_type: d.value === 'memoire_technique' ? 'tous' : 'mandataire',
        is_mandatory: d.mandatory,
      })),
    ];

    // Only add those not already present
    const toAdd = allDefaults.filter(d => !existingTypes.includes(d.deliverable_type));
    
    if (toAdd.length === 0) {
      toast.info("Tous les livrables par défaut sont déjà présents");
      return;
    }

    toAdd.forEach(d => {
      addDeliverable.mutate({
        deliverable_type: d.deliverable_type,
        name: d.name,
        responsible_type: d.responsible_type,
      });
    });

    toast.success(`${toAdd.length} livrable${toAdd.length > 1 ? 's' : ''} ajouté${toAdd.length > 1 ? 's' : ''}`);
  };

  const getResponsibleBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      mandataire: { label: 'Mandataire', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      tous: { label: 'Tous', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
      cotraitant: { label: 'Cotraitant', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
      sous_traitant: { label: 'Sous-traitant', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    };
    const c = config[type] || config.mandataire;
    return <Badge variant="outline" className={cn("text-xs", c.className)}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Missing Mandatory Warning */}
      {missingMandatory.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {missingMandatory.length} pièce{missingMandatory.length > 1 ? 's' : ''} réglementaire{missingMandatory.length > 1 ? 's' : ''} manquante{missingMandatory.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingMandatory.slice(0, 5).map(type => {
                    const docType = [...REQUIRED_DOCUMENT_TYPES.candidature, ...REQUIRED_DOCUMENT_TYPES.offre]
                      .find(d => d.value === type);
                    return (
                      <Badge key={type} variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                        {docType?.label || type}
                      </Badge>
                    );
                  })}
                  {missingMandatory.length > 5 && (
                    <Badge variant="outline" className="border-amber-400 text-amber-700">
                      +{missingMandatory.length - 5} autres
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Progression des livrables
            </CardTitle>
            <span className="text-2xl font-bold">{progressPercent}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{completedCount} / {totalCount} livrables validés</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDefaults}
              >
                <Download className="h-4 w-4 mr-2" />
                Charger liste FR
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliverables Table */}
      {deliverables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun livrable défini</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez les pièces à fournir pour ce concours
            </p>
            <Button 
              className="mt-4"
              onClick={handleLoadDefaults}
            >
              <Download className="h-4 w-4 mr-2" />
              Charger la liste marchés publics FR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Fait</TableHead>
                <TableHead>Livrable</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliverables.map((deliverable) => (
                <TableRow 
                  key={deliverable.id}
                  className={cn(deliverable.is_completed && "bg-green-50/50 dark:bg-green-950/10")}
                >
                  <TableCell>
                    <Checkbox
                      checked={deliverable.is_completed}
                      onCheckedChange={() => handleToggleComplete(deliverable.id, deliverable.is_completed)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {deliverable.is_completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "font-medium",
                        deliverable.is_completed && "line-through text-muted-foreground"
                      )}>
                        {deliverable.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {DELIVERABLE_TYPES.find(t => t.value === deliverable.deliverable_type)?.label || deliverable.deliverable_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getResponsibleBadge(deliverable.responsible_type)}
                  </TableCell>
                  <TableCell>
                    {deliverable.due_date ? (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(deliverable.due_date), "d MMM", { locale: fr })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteDeliverable.mutate(deliverable.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Deliverable Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un livrable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de livrable</Label>
              <Select
                value={newDeliverable.deliverable_type}
                onValueChange={(v) => {
                  const type = DELIVERABLE_TYPES.find(t => t.value === v);
                  setNewDeliverable({ 
                    ...newDeliverable, 
                    deliverable_type: v,
                    name: type?.label || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom personnalisé</Label>
              <Input
                value={newDeliverable.name}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                placeholder="Laisser vide pour utiliser le nom par défaut"
              />
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select
                value={newDeliverable.responsible_type}
                onValueChange={(v) => setNewDeliverable({ ...newDeliverable, responsible_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date d'échéance (optionnel)</Label>
              <Input
                type="date"
                value={newDeliverable.due_date}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={addDeliverable.isPending}>
              {addDeliverable.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
