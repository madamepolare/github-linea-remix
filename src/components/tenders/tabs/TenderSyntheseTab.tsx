import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  MapPin,
  Euro,
  Calendar,
  Ruler,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CalendarDays,
  ExternalLink,
  CalendarPlus,
  Check,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTenders } from "@/hooks/useTenders";
import { useTenderCalendarEvents } from "@/hooks/useTenderCalendarEvents";
import { 
  PROCEDURE_TYPE_LABELS, 
  CLIENT_TYPES,
  type Tender,
  type TenderStatus,
} from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequiredTeamEditor } from "@/components/tenders/RequiredTeamEditor";
import { SiteVisitAssignment } from "@/components/tenders/SiteVisitAssignment";

interface TenderSyntheseTabProps {
  tender: Tender;
  onNavigateToTab: (tab: string) => void;
}

// Required fields for Go/No-Go decision
const REQUIRED_FIELDS = [
  { key: 'client_name', label: 'Maître d\'ouvrage', icon: Building2 },
  { key: 'procedure_type', label: 'Type de marché', icon: FileText },
  { key: 'location', label: 'Lieu', icon: MapPin },
  { key: 'estimated_budget', label: 'Budget estimatif', icon: Euro },
  { key: 'submission_deadline', label: 'Date de dépôt', icon: Calendar },
  { key: 'description', label: 'Description du projet', icon: FileText },
] as const;

// Market types for the select
const MARKET_TYPES = [
  { value: 'concours', label: 'Concours' },
  { value: 'mapa', label: 'Marché public (MAPA)' },
  { value: 'ouvert', label: 'Appel d\'offres ouvert' },
  { value: 'restreint', label: 'Appel d\'offres restreint' },
  { value: 'adapte', label: 'Procédure adaptée' },
  { value: 'prive', label: 'Marché privé' },
];

export function TenderSyntheseTab({ tender, onNavigateToTab }: TenderSyntheseTabProps) {
  const { updateTender, updateStatus } = useTenders();
  const { syncSiteVisit, createTenderEvent } = useTenderCalendarEvents(tender.id);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showGoDialog, setShowGoDialog] = useState(false);
  const [goDecisionNotes, setGoDecisionNotes] = useState("");
  const [pendingDecision, setPendingDecision] = useState<'go' | 'no_go' | null>(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  
  // Local form state for inline editing
  const [formData, setFormData] = useState<Partial<Tender>>({
    client_name: tender.client_name,
    client_type: tender.client_type,
    procedure_type: tender.procedure_type,
    location: tender.location,
    estimated_budget: tender.estimated_budget,
    surface_area: tender.surface_area,
    submission_deadline: tender.submission_deadline,
    site_visit_required: tender.site_visit_required,
    site_visit_date: tender.site_visit_date,
    description: tender.description,
  });

  // Auto-sync to calendar when site visit date changes
  useEffect(() => {
    if (formData.site_visit_date && !addedToCalendar) {
      const autoSync = async () => {
        try {
          await syncSiteVisit({
            id: tender.id,
            title: tender.title,
            location: formData.location || tender.location,
            site_visit_date: formData.site_visit_date!,
            site_visit_required: formData.site_visit_required,
            site_visit_contact_name: (tender as any).site_visit_contact_name,
            site_visit_contact_email: (tender as any).site_visit_contact_email,
            site_visit_contact_phone: (tender as any).site_visit_contact_phone,
            site_visit_assigned_users: (tender as any).site_visit_assigned_users,
          });
          setAddedToCalendar(true);
        } catch (error) {
          console.error("Failed to sync site visit:", error);
        }
      };
      
      // Debounce to avoid multiple calls during typing
      const timeout = setTimeout(autoSync, 1500);
      return () => clearTimeout(timeout);
    }
  }, [formData.site_visit_date, formData.site_visit_required]);

  // Calculate missing fields
  const missingFields = useMemo(() => {
    return REQUIRED_FIELDS.filter(field => {
      const value = formData[field.key as keyof typeof formData] ?? tender[field.key as keyof Tender];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
  }, [formData, tender]);

  const hasAllRequiredFields = missingFields.length === 0;

  // Save changes when field loses focus
  const handleSaveField = (field: string, value: any) => {
    const updates = { [field]: value };
    setFormData(prev => ({ ...prev, ...updates }));
    updateTender.mutate({ id: tender.id, ...updates } as any);
  };

  // Generate AI summary
  const handleGenerateSummary = async () => {
    if (!hasAllRequiredFields) {
      toast.error("Veuillez remplir tous les champs obligatoires avant de générer le résumé");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-project-summary', {
        body: {
          tender: {
            ...tender,
            ...formData,
          }
        }
      });

      if (error) throw error;

      if (data?.summary) {
        handleSaveField('description', data.summary);
        toast.success("Résumé généré avec succès");
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error("Erreur lors de la génération du résumé");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Handle Go/No-Go decision
  const handleDecision = (decision: 'go' | 'no_go') => {
    if (!hasAllRequiredFields) {
      toast.error("Veuillez remplir tous les champs obligatoires avant de prendre une décision");
      return;
    }
    setPendingDecision(decision);
    setShowGoDialog(true);
  };

  const confirmDecision = () => {
    if (pendingDecision) {
      updateStatus.mutate({ 
        id: tender.id, 
        status: pendingDecision as TenderStatus,
        notes: goDecisionNotes 
      });
      setShowGoDialog(false);
      setPendingDecision(null);
      setGoDecisionNotes("");
    }
  };

  // Format deadline with time
  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return format(date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Check if deadline is soon (within 7 days)
  const isDeadlineSoon = useMemo(() => {
    if (!tender.submission_deadline) return false;
    const deadline = new Date(tender.submission_deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }, [tender.submission_deadline]);

  const isDeadlinePassed = useMemo(() => {
    if (!tender.submission_deadline) return false;
    return new Date(tender.submission_deadline) < new Date();
  }, [tender.submission_deadline]);

  return (
    <div className="space-y-6">
      {/* Missing Fields Alert - Sticky */}
      {missingFields.length > 0 && (
        <div className="sticky top-0 z-10">
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {missingFields.length} champ{missingFields.length > 1 ? 's' : ''} obligatoire{missingFields.length > 1 ? 's' : ''} manquant{missingFields.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {missingFields.map(field => (
                      <Badge 
                        key={field.key} 
                        variant="outline" 
                        className="border-amber-400 text-amber-700 dark:text-amber-300 cursor-pointer hover:bg-amber-100"
                        onClick={() => {
                          // Scroll to field
                          const el = document.getElementById(`field-${field.key}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          const input = el?.querySelector('input, select, textarea') as HTMLElement | null;
                          input?.focus();
                        }}
                      >
                        <field.icon className="h-3 w-3 mr-1" />
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-amber-400 text-amber-700 hover:bg-amber-100"
                  onClick={() => onNavigateToTab('analyse')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser le DCE
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Core Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Market Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations du marché</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div id="field-client_name" className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Maître d'ouvrage *
                  </Label>
                  <Input
                    value={formData.client_name || ""}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    onBlur={(e) => handleSaveField('client_name', e.target.value)}
                    placeholder="Nom du maître d'ouvrage"
                    className={cn(!formData.client_name && "border-amber-300")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type de client</Label>
                  <Select
                    value={formData.client_type || ""}
                    onValueChange={(v) => {
                      setFormData({ ...formData, client_type: v });
                      handleSaveField('client_type', v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div id="field-procedure_type" className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Type de marché *
                  </Label>
                  <Select
                    value={formData.procedure_type || ""}
                    onValueChange={(v) => {
                      setFormData({ ...formData, procedure_type: v as any });
                      handleSaveField('procedure_type', v);
                    }}
                  >
                    <SelectTrigger className={cn(!formData.procedure_type && "border-amber-300")}>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKET_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div id="field-location" className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Lieu *
                  </Label>
                  <Input
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    onBlur={(e) => handleSaveField('location', e.target.value)}
                    placeholder="Ville, département"
                    className={cn(!formData.location && "border-amber-300")}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div id="field-estimated_budget" className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    Budget estimatif (€ HT) *
                  </Label>
                  <Input
                    type="number"
                    value={formData.estimated_budget || ""}
                    onChange={(e) => setFormData({ ...formData, estimated_budget: parseFloat(e.target.value) || null })}
                    onBlur={(e) => handleSaveField('estimated_budget', parseFloat(e.target.value) || null)}
                    placeholder="Ex: 2500000"
                    className={cn(!formData.estimated_budget && "border-amber-300")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    Surface (m²)
                  </Label>
                  <Input
                    type="number"
                    value={formData.surface_area || ""}
                    onChange={(e) => setFormData({ ...formData, surface_area: parseFloat(e.target.value) || null })}
                    onBlur={(e) => handleSaveField('surface_area', parseFloat(e.target.value) || null)}
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Visit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Échéances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div id="field-submission_deadline" className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date et heure de dépôt *
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={formData.submission_deadline?.slice(0, 16) || ""}
                    onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                    onBlur={(e) => handleSaveField('submission_deadline', e.target.value || null)}
                    className={cn("flex-1", !formData.submission_deadline && "border-amber-300")}
                  />
                </div>
                {formData.submission_deadline && (
                  <p className={cn(
                    "text-sm",
                    isDeadlinePassed ? "text-red-600" : isDeadlineSoon ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    {isDeadlinePassed ? "⚠️ Délai dépassé : " : isDeadlineSoon ? "⏰ " : ""}
                    {formatDeadline(formData.submission_deadline)}
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    Visite obligatoire
                  </Label>
                  <Switch
                    checked={formData.site_visit_required || false}
                    onCheckedChange={(v) => {
                      setFormData({ ...formData, site_visit_required: v });
                      handleSaveField('site_visit_required', v);
                    }}
                  />
                </div>

                {formData.site_visit_required && (
                  <div className="pl-6 border-l-2 border-primary/20 space-y-3">
                    <div className="space-y-2">
                      <Label>Date et heure de la visite</Label>
                      <Input
                        type="datetime-local"
                        value={formData.site_visit_date?.slice(0, 16) || ""}
                        onChange={(e) => setFormData({ ...formData, site_visit_date: e.target.value })}
                        onBlur={(e) => handleSaveField('site_visit_date', e.target.value || null)}
                      />
                    </div>
                    {formData.site_visit_date && (
                      <SiteVisitAssignment
                        tenderId={tender.id}
                        tenderTitle={tender.title}
                        siteVisitDate={formData.site_visit_date}
                        siteVisitRequired={formData.site_visit_required || false}
                        location={(tender as any).site_visit_location || formData.location || tender.location}
                        projectAddress={formData.location || tender.location}
                        contactName={(tender as any).site_visit_contact_name || null}
                        contactEmail={(tender as any).site_visit_contact_email || null}
                        contactPhone={(tender as any).site_visit_contact_phone || null}
                        assignedUserIds={(tender as any).site_visit_assigned_users || []}
                        onAssignmentChange={(userIds) => {
                          handleSaveField('site_visit_assigned_users', userIds);
                        }}
                        onContactChange={(contact) => {
                          handleSaveField('site_visit_contact_name', contact.name);
                          handleSaveField('site_visit_contact_email', contact.email);
                          handleSaveField('site_visit_contact_phone', contact.phone);
                          handleSaveField('site_visit_location', contact.address);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description & AI Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Description du projet</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary || !hasAllRequiredFields}
                >
                  {isGeneratingSummary ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Générer résumé IA
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div id="field-description" className="space-y-2">
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onBlur={(e) => handleSaveField('description', e.target.value)}
                  placeholder="Description du projet, enjeux, contexte..."
                  rows={6}
                  className={cn(!formData.description && "border-amber-300")}
                />
                <p className="text-xs text-muted-foreground">
                  Ce résumé sera utilisé dans le mémoire technique et les présentations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Required Team / Competencies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Équipe requise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Définissez les compétences requises pour constituer l'équipe de maîtrise d'œuvre.
              </p>
              <RequiredTeamEditor
                team={(Array.isArray(tender.required_team) ? tender.required_team : []) as Array<{ id: string; specialty: string; is_mandatory: boolean; notes?: string }>}
                onChange={(team) => handleSaveField('required_team', team)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Decision & Status */}
        <div className="space-y-6">
          {/* Go / No-Go Decision Card */}
          <Card className={cn(
            "border-2",
            tender.status === 'go' && "border-green-300 bg-green-50/50 dark:bg-green-950/20",
            tender.status === 'no_go' && "border-red-300 bg-red-50/50 dark:bg-red-950/20"
          )}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {tender.status === 'go' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Décision : Go
                  </>
                ) : tender.status === 'no_go' ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Décision : No-Go
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    En attente de décision
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tender.go_decision_date && (
                <p className="text-sm text-muted-foreground">
                  Décision prise le {format(new Date(tender.go_decision_date), "d MMMM yyyy", { locale: fr })}
                </p>
              )}
              
              {tender.go_decision_notes && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  {tender.go_decision_notes}
                </div>
              )}

              {tender.status !== 'go' && tender.status !== 'no_go' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => handleDecision('no_go')}
                    disabled={!hasAllRequiredFields}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    No-Go
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleDecision('go')}
                    disabled={!hasAllRequiredFields}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Go
                  </Button>
                </div>
              )}

              {!hasAllRequiredFields && tender.status !== 'go' && tender.status !== 'no_go' && (
                <p className="text-xs text-amber-600 text-center">
                  Remplissez tous les champs obligatoires pour prendre une décision
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigateToTab('analyse')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analyse IA du DCE
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigateToTab('documents')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gérer les documents
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onNavigateToTab('equipe')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Constituer l'équipe
              </Button>
              {tender.source_url && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir la source
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Completion Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complétude</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {REQUIRED_FIELDS.map(field => {
                  const value = formData[field.key as keyof typeof formData] ?? tender[field.key as keyof Tender];
                  const isFilled = value && (typeof value !== 'string' || value.trim() !== '');
                  
                  return (
                    <div key={field.key} className="flex items-center gap-2 text-sm">
                      {isFilled ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className={cn(!isFilled && "text-muted-foreground")}>
                        {field.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Go/No-Go Decision Dialog */}
      <Dialog open={showGoDialog} onOpenChange={setShowGoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingDecision === 'go' ? (
                <>
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Confirmer la décision Go
                </>
              ) : (
                <>
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  Confirmer la décision No-Go
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingDecision === 'go' 
                ? "Vous confirmez vouloir répondre à ce concours. L'équipe sera notifiée."
                : "Vous confirmez ne pas répondre à ce concours. Vous pouvez indiquer la raison ci-dessous."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={goDecisionNotes}
                onChange={(e) => setGoDecisionNotes(e.target.value)}
                placeholder={pendingDecision === 'go' 
                  ? "Points clés de la décision, objectifs..."
                  : "Raison du refus, pour mémoire..."
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={confirmDecision}
              className={pendingDecision === 'go' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
