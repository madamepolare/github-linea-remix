import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Bell,
  Target,
  Layers,
  Plus,
  X,
  GripVertical,
  Check,
  Settings2,
  Columns,
  FolderKanban,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useTenderSettings,
  type TenderPhaseTemplate,
  type TenderCriterionTemplate,
  type TenderLotDomainTemplate,
  type TenderPipelineColumn,
} from "@/hooks/useTenderSettings";
import { TenderTypesSection } from "./TenderTypesSection";
import { DisciplinesSection } from "./DisciplinesSection";

// ============= PHASES SECTION =============

function PhasesSection() {
  const { tenderSettings, updatePhase, removePhase, addPhase, updateTenderSettings } = useTenderSettings();
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDuration, setNewPhaseDuration] = useState(30);

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    addPhase({
      name: newPhaseName,
      duration_days: newPhaseDuration,
      is_default: false,
    });
    setNewPhaseName("");
    setNewPhaseDuration(30);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Phases par défaut</h4>
          <p className="text-sm text-muted-foreground">
            Phases créées automatiquement pour chaque nouvel AO
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {tenderSettings.default_phases.map((phase) => (
          <div
            key={phase.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Input
                value={phase.name}
                onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                className="h-9"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={phase.duration_days}
                  onChange={(e) => updatePhase(phase.id, { duration_days: parseInt(e.target.value) || 0 })}
                  className="h-9 w-20"
                />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
            <Switch
              checked={phase.is_default}
              onCheckedChange={(checked) => updatePhase(phase.id, { is_default: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={() => removePhase(phase.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nouvelle phase..."
          value={newPhaseName}
          onChange={(e) => setNewPhaseName(e.target.value)}
          className="h-9 flex-1"
        />
        <Input
          type="number"
          value={newPhaseDuration}
          onChange={(e) => setNewPhaseDuration(parseInt(e.target.value) || 0)}
          className="h-9 w-20"
        />
        <span className="text-sm text-muted-foreground">jours</span>
        <Button size="sm" onClick={handleAddPhase} disabled={!newPhaseName.trim()}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

// ============= REMINDERS SECTION =============

function RemindersSection() {
  const { tenderSettings, updateTenderSettings } = useTenderSettings();

  const updateValidityReminder = (days: number[]) => {
    updateTenderSettings.mutate({
      validity_reminder: { ...tenderSettings.validity_reminder, days_before: days },
    });
  };

  const updateSubmissionReminder = (days: number[]) => {
    updateTenderSettings.mutate({
      submission_reminder: { ...tenderSettings.submission_reminder, days_before: days },
    });
  };

  const toggleValidityReminder = (enabled: boolean) => {
    updateTenderSettings.mutate({
      validity_reminder: { ...tenderSettings.validity_reminder, enabled },
    });
  };

  const toggleSubmissionReminder = (enabled: boolean) => {
    updateTenderSettings.mutate({
      submission_reminder: { ...tenderSettings.submission_reminder, enabled },
    });
  };

  const reminderOptions = [
    { value: 90, label: "3 mois" },
    { value: 60, label: "2 mois" },
    { value: 30, label: "1 mois" },
    { value: 14, label: "2 semaines" },
    { value: 7, label: "1 semaine" },
    { value: 3, label: "3 jours" },
    { value: 1, label: "1 jour" },
  ];

  return (
    <div className="space-y-6">
      {/* Validity Reminder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Rappels fin de validité</h4>
            <p className="text-sm text-muted-foreground">
              Alertes avant expiration de la validité d'une offre
            </p>
          </div>
          <Switch
            checked={tenderSettings.validity_reminder.enabled}
            onCheckedChange={toggleValidityReminder}
          />
        </div>
        {tenderSettings.validity_reminder.enabled && (
          <div className="flex flex-wrap gap-2">
            {reminderOptions.map((opt) => {
              const isSelected = tenderSettings.validity_reminder.days_before.includes(opt.value);
              return (
                <Badge
                  key={opt.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-primary"
                  )}
                  onClick={() => {
                    const newDays = isSelected
                      ? tenderSettings.validity_reminder.days_before.filter(d => d !== opt.value)
                      : [...tenderSettings.validity_reminder.days_before, opt.value].sort((a, b) => b - a);
                    updateValidityReminder(newDays);
                  }}
                >
                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                  {opt.label}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Reminder */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Rappels date de remise</h4>
            <p className="text-sm text-muted-foreground">
              Alertes avant la date limite de dépôt
            </p>
          </div>
          <Switch
            checked={tenderSettings.submission_reminder.enabled}
            onCheckedChange={toggleSubmissionReminder}
          />
        </div>
        {tenderSettings.submission_reminder.enabled && (
          <div className="flex flex-wrap gap-2">
            {reminderOptions.map((opt) => {
              const isSelected = tenderSettings.submission_reminder.days_before.includes(opt.value);
              return (
                <Badge
                  key={opt.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-primary"
                  )}
                  onClick={() => {
                    const newDays = isSelected
                      ? tenderSettings.submission_reminder.days_before.filter(d => d !== opt.value)
                      : [...tenderSettings.submission_reminder.days_before, opt.value].sort((a, b) => b - a);
                    updateSubmissionReminder(newDays);
                  }}
                >
                  {isSelected && <Check className="h-3 w-3 mr-1" />}
                  {opt.label}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Validity Days */}
      <div className="space-y-3 pt-4 border-t">
        <div>
          <h4 className="font-medium">Durée de validité par défaut</h4>
          <p className="text-sm text-muted-foreground">
            Durée de validité des offres après dépôt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={tenderSettings.default_offer_validity_days}
            onChange={(e) => updateTenderSettings.mutate({
              default_offer_validity_days: parseInt(e.target.value) || 90
            })}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">jours</span>
        </div>
      </div>
    </div>
  );
}

// ============= CRITERIA SECTION =============

function CriteriaSection() {
  const { tenderSettings, updateCriterion, removeCriterion, addCriterion } = useTenderSettings();
  const [newCriterionName, setNewCriterionName] = useState("");
  const [newCriterionType, setNewCriterionType] = useState<TenderCriterionTemplate['type']>("technical");
  const [newCriterionWeight, setNewCriterionWeight] = useState(20);

  const criterionTypes = [
    { value: "price", label: "Prix" },
    { value: "technical", label: "Technique" },
    { value: "delay", label: "Délais" },
    { value: "environmental", label: "Environnement" },
    { value: "social", label: "Social" },
    { value: "creativity", label: "Créativité" },
    { value: "methodology", label: "Méthodologie" },
  ];

  const handleAddCriterion = () => {
    if (!newCriterionName.trim()) return;
    addCriterion({
      name: newCriterionName,
      type: newCriterionType,
      default_weight: newCriterionWeight,
      is_default: false,
    });
    setNewCriterionName("");
    setNewCriterionWeight(20);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Critères de notation</h4>
        <p className="text-sm text-muted-foreground">
          Critères proposés par défaut lors de la création d'un AO
        </p>
      </div>

      <div className="space-y-2">
        {tenderSettings.default_criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
          >
            <div className="flex-1 grid grid-cols-3 gap-3">
              <Input
                value={criterion.name}
                onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                className="h-9"
              />
              <Select
                value={criterion.type}
                onValueChange={(v) => updateCriterion(criterion.id, { type: v as TenderCriterionTemplate['type'] })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {criterionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={criterion.default_weight}
                  onChange={(e) => updateCriterion(criterion.id, { default_weight: parseInt(e.target.value) || 0 })}
                  className="h-9 w-20"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Switch
              checked={criterion.is_default}
              onCheckedChange={(checked) => updateCriterion(criterion.id, { is_default: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={() => removeCriterion(criterion.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Nouveau critère..."
          value={newCriterionName}
          onChange={(e) => setNewCriterionName(e.target.value)}
          className="h-9 flex-1"
        />
        <Select value={newCriterionType} onValueChange={(v) => setNewCriterionType(v as TenderCriterionTemplate['type'])}>
          <SelectTrigger className="h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {criterionTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={newCriterionWeight}
          onChange={(e) => setNewCriterionWeight(parseInt(e.target.value) || 0)}
          className="h-9 w-20"
        />
        <span className="text-sm text-muted-foreground">%</span>
        <Button size="sm" onClick={handleAddCriterion} disabled={!newCriterionName.trim()}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

// ============= LOT DOMAINS SECTION =============

function LotDomainsSection() {
  const { tenderSettings, updateLotDomain, removeLotDomain, addLotDomain } = useTenderSettings();
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainColor, setNewDomainColor] = useState("#8B5CF6");

  const handleAddDomain = () => {
    if (!newDomainName.trim()) return;
    addLotDomain({
      name: newDomainName,
      color: newDomainColor,
      is_default: false,
    });
    setNewDomainName("");
    setNewDomainColor("#8B5CF6");
  };

  const colorOptions = [
    "#8B5CF6", "#F59E0B", "#3B82F6", "#EC4899",
    "#EF4444", "#10B981", "#6366F1", "#14B8A6",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Domaines / Types de lots</h4>
        <p className="text-sm text-muted-foreground">
          Domaines proposés pour les marchés multi-lots (communication)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tenderSettings.default_lot_domains.map((domain) => (
          <div
            key={domain.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
          >
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: domain.color || "#8B5CF6" }}
            />
            <Input
              value={domain.name}
              onChange={(e) => updateLotDomain(domain.id, { name: e.target.value })}
              className="h-9 flex-1"
            />
            <Switch
              checked={domain.is_default}
              onCheckedChange={(checked) => updateLotDomain(domain.id, { is_default: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={() => removeLotDomain(domain.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {colorOptions.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full transition-transform",
                newDomainColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setNewDomainColor(color)}
            />
          ))}
        </div>
        <Input
          placeholder="Nouveau domaine..."
          value={newDomainName}
          onChange={(e) => setNewDomainName(e.target.value)}
          className="h-9 flex-1"
        />
        <Button size="sm" onClick={handleAddDomain} disabled={!newDomainName.trim()}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

// ============= PIPELINE COLUMNS SECTION =============

function PipelineColumnsSection() {
  const { tenderSettings, updatePipelineColumn, removePipelineColumn, addPipelineColumn } = useTenderSettings();
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("#8B5CF6");

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    addPipelineColumn({
      name: newColumnName,
      color: newColumnColor,
      is_visible: true,
    });
    setNewColumnName("");
    setNewColumnColor("#8B5CF6");
  };

  const colorOptions = [
    "#f59e0b", "#3b82f6", "#10b981", "#6b7280",
    "#8B5CF6", "#EC4899", "#EF4444", "#14B8A6",
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Colonnes du tableau de bord</h4>
        <p className="text-sm text-muted-foreground">
          Configurez les colonnes affichées en vue Kanban
        </p>
      </div>

      <div className="space-y-2">
        {tenderSettings.pipeline_columns.map((column) => (
          <div
            key={column.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            <div
              className="w-4 h-4 rounded-full shrink-0 cursor-pointer"
              style={{ backgroundColor: column.color }}
            />
            <Input
              value={column.name}
              onChange={(e) => updatePipelineColumn(column.id, { name: e.target.value })}
              className="h-9 flex-1"
            />
            <Switch
              checked={column.is_visible}
              onCheckedChange={(checked) => updatePipelineColumn(column.id, { is_visible: checked })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={() => removePipelineColumn(column.id)}
              disabled={['a_approuver', 'en_cours', 'deposes'].includes(column.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {colorOptions.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded-full transition-transform",
                newColumnColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setNewColumnColor(color)}
            />
          ))}
        </div>
        <Input
          placeholder="Nouvelle colonne..."
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          className="h-9 flex-1"
        />
        <Button size="sm" onClick={handleAddColumn} disabled={!newColumnName.trim()}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

// ============= OTHER SETTINGS SECTION =============

function OtherSettingsSection() {
  const { tenderSettings, updateTenderSettings } = useTenderSettings();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <h4 className="font-medium">Création automatique de tâches</h4>
          <p className="text-sm text-muted-foreground">
            Créer une tâche automatiquement pour les cas pratiques avec suggestion de ressources
          </p>
        </div>
        <Switch
          checked={tenderSettings.auto_create_tasks_for_case_study}
          onCheckedChange={(checked) => updateTenderSettings.mutate({
            auto_create_tasks_for_case_study: checked
          })}
        />
      </div>
    </div>
  );
}

// ============= MAIN COMPONENT =============

export function TenderSettings() {
  const { isLoading } = useTenderSettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Paramètres Appels d'Offres
          </CardTitle>
          <CardDescription>
            Configuration par défaut pour les appels d'offres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="disciplines" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="disciplines" className="gap-2">
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Disciplines</span>
              </TabsTrigger>
              <TabsTrigger value="types" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                <span className="hidden sm:inline">Types</span>
              </TabsTrigger>
              <TabsTrigger value="columns" className="gap-2">
                <Columns className="h-4 w-4" />
                <span className="hidden sm:inline">Colonnes</span>
              </TabsTrigger>
              <TabsTrigger value="phases" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Phases</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Rappels</span>
              </TabsTrigger>
              <TabsTrigger value="criteria" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Critères</span>
              </TabsTrigger>
              <TabsTrigger value="domains" className="gap-2">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Domaines</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="disciplines">
              <DisciplinesSection />
            </TabsContent>

            <TabsContent value="types">
              <TenderTypesSection />
            </TabsContent>

            <TabsContent value="columns">
              <PipelineColumnsSection />
            </TabsContent>

            <TabsContent value="phases">
              <PhasesSection />
            </TabsContent>

            <TabsContent value="reminders">
              <RemindersSection />
            </TabsContent>

            <TabsContent value="criteria">
              <CriteriaSection />
            </TabsContent>

            <TabsContent value="domains">
              <LotDomainsSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Autres paramètres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OtherSettingsSection />
        </CardContent>
      </Card>
    </motion.div>
  );
}
