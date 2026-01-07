import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Building2,
  Mail,
  Trash2,
  Send,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Euro,
  ArrowRight,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Edit2,
  MessageSquare,
  Phone,
  ExternalLink,
  Eye,
  StickyNote,
  Copy,
  Download,
  GripVertical,
  Star,
  RefreshCw,
  CheckSquare,
  Square,
  Wand2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTenderTeam } from "@/hooks/useTenderTeam";
import { useTenderPartnerCandidates, CANDIDATE_STATUS_LABELS, CANDIDATE_STATUS_COLORS, type PartnerCandidate } from "@/hooks/useTenderPartnerCandidates";
import { useTender } from "@/hooks/useTenders";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { TEAM_ROLE_LABELS, SPECIALTIES, type TenderTeamRole } from "@/lib/tenderTypes";
import { BulkInvitationDialog } from "@/components/tenders/BulkInvitationDialog";
import { PartnerPrefilterPanel } from "@/components/tenders/PartnerPrefilterPanel";
import { PartnerProposalEmailDialog } from "@/components/tenders/PartnerProposalEmailDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TenderEquipeTabProps {
  tenderId: string;
  requiredCompetencies?: string[];
}

export function TenderEquipeTab({ tenderId, requiredCompetencies = [] }: TenderEquipeTabProps) {
  // Team (confirmed members)
  const { teamMembers, teamByRole, isLoading: teamLoading, addTeamMember, updateTeamMember, removeTeamMember, sendInvitation } = useTenderTeam(tenderId);
  
  // Candidates (pipeline)
  const { 
    candidates, 
    candidatesBySpecialty, 
    stats, 
    isLoading: candidatesLoading,
    addCandidate,
    updateCandidate,
    removeCandidate,
    confirmToTeam,
    sendBulkInvitations,
  } = useTenderPartnerCandidates(tenderId);

  const { data: tender } = useTender(tenderId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();

  // UI State
  const [activeView, setActiveView] = useState<"pipeline" | "team">("pipeline");
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  const [showAddTeamMemberDialog, setShowAddTeamMemberDialog] = useState(false);
  const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false);
  const [showPrefilterPanel, setShowPrefilterPanel] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [companySearch, setCompanySearch] = useState("");
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>("all");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  
  const [newCandidate, setNewCandidate] = useState({
    specialty: "",
    role: "cotraitant" as TenderTeamRole,
    company_id: "",
    contact_id: "",
    fee_percentage: "",
  });

  const [newTeamMember, setNewTeamMember] = useState({
    specialty: "",
    role: "cotraitant" as TenderTeamRole,
    company_id: "",
    contact_id: "",
    notes: "",
  });

  // Editing candidate
  const [editingCandidate, setEditingCandidate] = useState<PartnerCandidate | null>(null);
  const [editingTeamMember, setEditingTeamMember] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'candidate' | 'team'; id: string; name: string } | null>(null);

  // Partner proposal email dialog
  const [proposalEmailTarget, setProposalEmailTarget] = useState<{
    id: string;
    companyName: string;
    contactEmail: string;
    contactName?: string;
    specialty: string;
    proposedFeePercentage?: number;
  } | null>(null);

  // Single invitation dialog (legacy - keeping for compatibility)
  const [singleInviteTarget, setSingleInviteTarget] = useState<{ 
    type: 'candidate' | 'team'; 
    id: string; 
    email: string; 
    name: string;
    specialty: string;
  } | null>(null);
  const [singleInviteSubject, setSingleInviteSubject] = useState("");
  const [singleInviteBody, setSingleInviteBody] = useState("");

  // Missing specialties - using BET specialties keys
  const defaultRequired = ['architecte', 'structure', 'fluides', 'thermique'];
  const requiredSpecialties = requiredCompetencies.length > 0 ? requiredCompetencies : defaultRequired;
  const coveredByTeam = teamMembers.map(m => m.specialty).filter(Boolean);
  const coveredByCandidates = candidates.filter(c => c.status === 'confirmed').map(c => c.specialty);
  const allCovered = [...coveredByTeam, ...coveredByCandidates];
  const missingSpecialties = requiredSpecialties.filter(s => !allCovered.includes(s));

  // Filter companies by specialty
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !companySearch || 
      c.name.toLowerCase().includes(companySearch.toLowerCase());
    const targetSpecialty = showAddCandidateDialog ? newCandidate.specialty : newTeamMember.specialty;
    const matchesSpecialty = !targetSpecialty || 
      c.bet_specialties?.includes(targetSpecialty) ||
      c.industry?.toLowerCase().includes(targetSpecialty.replace('_', ' '));
    return matchesSearch && (matchesSpecialty || !targetSpecialty);
  });

  // Get contacts for selected company
  const getCompanyContacts = (companyId: string) => contacts.filter(c => c.crm_company_id === companyId);
  const candidateCompanyContacts = getCompanyContacts(newCandidate.company_id);
  const teamMemberCompanyContacts = getCompanyContacts(newTeamMember.company_id);

  // Filtered pipeline candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = !pipelineSearch || 
        c.company?.name?.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        c.contact?.name?.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        c.contact?.email?.toLowerCase().includes(pipelineSearch.toLowerCase());
      const matchesStatus = pipelineStatusFilter === 'all' || c.status === pipelineStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidates, pipelineSearch, pipelineStatusFilter]);

  const filteredCandidatesBySpecialty = useMemo(() => {
    return filteredCandidates.reduce((acc, c) => {
      if (!acc[c.specialty]) acc[c.specialty] = [];
      acc[c.specialty].push(c);
      return acc;
    }, {} as Record<string, PartnerCandidate[]>);
  }, [filteredCandidates]);

  const handleAddCandidate = () => {
    addCandidate.mutate({
      specialty: newCandidate.specialty,
      role: newCandidate.role,
      company_id: newCandidate.company_id || undefined,
      contact_id: newCandidate.contact_id || undefined,
      fee_percentage: newCandidate.fee_percentage ? parseFloat(newCandidate.fee_percentage) : undefined,
    });
    setShowAddCandidateDialog(false);
    resetNewCandidate();
  };

  const handleAddTeamMember = () => {
    addTeamMember.mutate({
      specialty: newTeamMember.specialty,
      role: newTeamMember.role,
      company_id: newTeamMember.company_id || undefined,
      contact_id: newTeamMember.contact_id || undefined,
      notes: newTeamMember.notes || undefined,
    });
    setShowAddTeamMemberDialog(false);
    resetNewTeamMember();
  };

  const resetNewCandidate = () => {
    setNewCandidate({
      specialty: "",
      role: "cotraitant",
      company_id: "",
      contact_id: "",
      fee_percentage: "",
    });
    setCompanySearch("");
  };

  const resetNewTeamMember = () => {
    setNewTeamMember({
      specialty: "",
      role: "cotraitant",
      company_id: "",
      contact_id: "",
      notes: "",
    });
    setCompanySearch("");
  };

  const openAddDialogWithSpecialty = (specialty: string) => {
    setNewCandidate(prev => ({ ...prev, specialty }));
    setShowAddCandidateDialog(true);
  };

  const openSingleInvite = (type: 'candidate' | 'team', id: string, email: string, name: string, specialty: string) => {
    setSingleInviteTarget({ type, id, email, name, specialty });
    setSingleInviteSubject(`Appel à partenariat - ${tender?.title?.substring(0, 50) || 'Projet'}`);
    setSingleInviteBody(`Bonjour,

Nous constituons actuellement une équipe de maîtrise d'œuvre pour répondre à un appel d'offres et souhaiterions vous associer à ce projet en tant que ${SPECIALTIES.find(s => s.value === specialty)?.label || specialty}.

Projet: ${tender?.title || ''}
${tender?.location ? `Localisation: ${tender.location}` : ''}

Merci de nous faire part de votre intérêt.

Cordialement`);
  };

  const handleSendSingleInvite = async () => {
    if (!singleInviteTarget) return;
    
    if (singleInviteTarget.type === 'team') {
      await sendInvitation.mutateAsync({
        memberId: singleInviteTarget.id,
        subject: singleInviteSubject,
        body: singleInviteBody,
      });
    } else {
      await sendBulkInvitations.mutateAsync({
        candidateIds: [singleInviteTarget.id],
        subject: singleInviteSubject,
        body: singleInviteBody,
        includeFeesProposal: true,
      });
    }
    setSingleInviteTarget(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'candidate') {
      removeCandidate.mutate(deleteConfirm.id);
    } else {
      removeTeamMember.mutate(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  // Get candidates ready for bulk invitation
  const candidatesToInvite = candidates.filter(c => 
    c.status === 'suggested' && c.contact?.email
  );

  const isLoading = teamLoading || candidatesLoading;

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "pipeline" | "team")}>
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Pipeline partenaires
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Équipe confirmée
              {teamMembers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{teamMembers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {activeView === "pipeline" && (
            <Button variant="outline" onClick={() => setShowPrefilterPanel(true)}>
              <Wand2 className="h-4 w-4 mr-2" />
              Sélection intelligente
            </Button>
          )}
          {activeView === "pipeline" && candidatesToInvite.length > 0 && (
            <Button onClick={() => setShowBulkInviteDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Inviter ({candidatesToInvite.length})
            </Button>
          )}
          {activeView === "team" && (
            <Button onClick={() => setShowAddTeamMemberDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          )}
        </div>
      </div>

      {/* Missing Specialties Warning */}
      {missingSpecialties.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Compétences manquantes détectées
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajoutez des partenaires avec ces spécialités pour constituer un groupement complet.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {missingSpecialties.map(s => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
                      onClick={() => openAddDialogWithSpecialty(s)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                    </Button>
                  ))}
                </div>
              </div>
              <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === "pipeline" ? (
        <PipelineView
          candidates={filteredCandidates}
          candidatesBySpecialty={filteredCandidatesBySpecialty}
          stats={stats}
          search={pipelineSearch}
          onSearchChange={setPipelineSearch}
          statusFilter={pipelineStatusFilter}
          onStatusFilterChange={setPipelineStatusFilter}
          estimatedBudget={tender?.estimated_budget}
          selectedCandidates={selectedCandidates}
          onSelectionChange={setSelectedCandidates}
          onAddCandidate={() => setShowAddCandidateDialog(true)}
          onAddWithSpecialty={openAddDialogWithSpecialty}
          onEditCandidate={setEditingCandidate}
          onUpdateCandidate={(id, updates) => updateCandidate.mutate({ id, ...updates })}
          onBulkUpdateStatus={(ids, status) => {
            ids.forEach(id => updateCandidate.mutate({ id, status: status as any }));
            setSelectedCandidates(new Set());
          }}
          onBulkRemove={(ids) => {
            ids.forEach(id => removeCandidate.mutate(id));
            setSelectedCandidates(new Set());
          }}
          onBulkConfirm={(ids) => {
            ids.forEach(id => confirmToTeam.mutate(id));
            setSelectedCandidates(new Set());
          }}
          onRemoveCandidate={(id, name) => setDeleteConfirm({ type: 'candidate', id, name })}
          onConfirmToTeam={(id) => confirmToTeam.mutate(id)}
          onSendInvite={(candidate) => {
            if (candidate.contact?.email) {
              setProposalEmailTarget({
                id: candidate.id,
                companyName: candidate.company?.name || candidate.contact?.name || "Partenaire",
                contactEmail: candidate.contact.email,
                contactName: candidate.contact?.name,
                specialty: candidate.specialty,
                proposedFeePercentage: candidate.fee_percentage || undefined,
              });
            } else {
              toast.error("Pas d'email pour ce contact");
            }
          }}
          onBulkInvite={() => setShowBulkInviteDialog(true)}
          isLoading={isLoading}
        />
      ) : (
        <TeamView
          teamMembers={teamMembers}
          teamByRole={teamByRole}
          onEditMember={setEditingTeamMember}
          onRemoveMember={(id, name) => setDeleteConfirm({ type: 'team', id, name })}
          onSendInvite={(member) => {
            if (member.contact?.email) {
              setProposalEmailTarget({
                id: member.id,
                companyName: member.company?.name || member.contact?.name || "Partenaire",
                contactEmail: member.contact.email,
                contactName: member.contact?.name,
                specialty: member.specialty || "",
              });
            } else {
              toast.error("Pas d'email pour ce contact");
            }
          }}
          isLoading={isLoading}
        />
      )}

      {/* Add Candidate Dialog */}
      <Dialog open={showAddCandidateDialog} onOpenChange={setShowAddCandidateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un partenaire potentiel</DialogTitle>
            <DialogDescription>
              Sélectionnez une entreprise du CRM pour l'ajouter à votre pipeline de partenaires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Spécialité *</Label>
                <Select
                  value={newCandidate.specialty}
                  onValueChange={(v) => setNewCandidate({ ...newCandidate, specialty: v, company_id: "", contact_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={newCandidate.role}
                  onValueChange={(v) => setNewCandidate({ ...newCandidate, role: v as TenderTeamRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Entreprise (CRM)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredCompanies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {newCandidate.specialty 
                        ? `Aucune entreprise avec la spécialité "${SPECIALTIES.find(s => s.value === newCandidate.specialty)?.label}"`
                        : "Aucune entreprise trouvée"}
                    </p>
                  ) : (
                    filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          newCandidate.company_id === company.id
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          setNewCandidate({ 
                            ...newCandidate, 
                            company_id: company.id,
                            contact_id: "",
                          });
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logo_url || undefined} />
                          <AvatarFallback>{company.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{company.name}</p>
                          {company.bet_specialties && company.bet_specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {company.bet_specialties.slice(0, 2).map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px] px-1 py-0">
                                  {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {newCandidate.company_id === company.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {newCandidate.company_id && candidateCompanyContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={newCandidate.contact_id}
                  onValueChange={(v) => setNewCandidate({ ...newCandidate, contact_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateCompanyContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Proposition d'honoraires (%)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 12.5"
                value={newCandidate.fee_percentage}
                onChange={(e) => setNewCandidate({ ...newCandidate, fee_percentage: e.target.value })}
                step="0.5"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage des honoraires globaux proposé à ce partenaire
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddCandidateDialog(false);
              resetNewCandidate();
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddCandidate} 
              disabled={!newCandidate.specialty || addCandidate.isPending}
            >
              Ajouter au pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Member Dialog */}
      <Dialog open={showAddTeamMemberDialog} onOpenChange={setShowAddTeamMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
            <DialogDescription>
              Ajoutez directement un membre confirmé à l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Spécialité *</Label>
                <Select
                  value={newTeamMember.specialty}
                  onValueChange={(v) => setNewTeamMember({ ...newTeamMember, specialty: v, company_id: "", contact_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={newTeamMember.role}
                  onValueChange={(v) => setNewTeamMember({ ...newTeamMember, role: v as TenderTeamRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Entreprise (CRM)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredCompanies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune entreprise trouvée
                    </p>
                  ) : (
                    filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          newTeamMember.company_id === company.id
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          setNewTeamMember({ 
                            ...newTeamMember, 
                            company_id: company.id,
                            contact_id: "",
                          });
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logo_url || undefined} />
                          <AvatarFallback>{company.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{company.name}</p>
                        </div>
                        {newTeamMember.company_id === company.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {newTeamMember.company_id && teamMemberCompanyContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={newTeamMember.contact_id}
                  onValueChange={(v) => setNewTeamMember({ ...newTeamMember, contact_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMemberCompanyContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes sur ce membre..."
                value={newTeamMember.notes}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddTeamMemberDialog(false);
              resetNewTeamMember();
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddTeamMember} 
              disabled={!newTeamMember.specialty || addTeamMember.isPending}
            >
              Ajouter à l'équipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={!!editingCandidate} onOpenChange={() => setEditingCandidate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le partenaire</DialogTitle>
          </DialogHeader>
          {editingCandidate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={editingCandidate.company?.logo_url || undefined} />
                  <AvatarFallback>
                    {editingCandidate.company?.name?.substring(0, 2) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingCandidate.company?.name || editingCandidate.contact?.name}</p>
                  <p className="text-sm text-muted-foreground">{editingCandidate.contact?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Select
                    value={editingCandidate.specialty}
                    onValueChange={(v) => setEditingCandidate({ ...editingCandidate, specialty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select
                    value={editingCandidate.role}
                    onValueChange={(v) => setEditingCandidate({ ...editingCandidate, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Honoraires (%)</Label>
                <Input
                  type="number"
                  value={editingCandidate.fee_percentage || ''}
                  onChange={(e) => setEditingCandidate({ 
                    ...editingCandidate, 
                    fee_percentage: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  step="0.5"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes de réponse</Label>
                <Textarea
                  placeholder="Notes sur la réponse du partenaire..."
                  value={editingCandidate.response_notes || ''}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, response_notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCandidate(null)}>
              Annuler
            </Button>
            <Button onClick={() => {
              if (editingCandidate) {
                updateCandidate.mutate({
                  id: editingCandidate.id,
                  specialty: editingCandidate.specialty,
                  role: editingCandidate.role,
                  fee_percentage: editingCandidate.fee_percentage,
                  response_notes: editingCandidate.response_notes,
                });
                setEditingCandidate(null);
                toast.success("Partenaire modifié");
              }
            }}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Dialog */}
      <Dialog open={!!editingTeamMember} onOpenChange={() => setEditingTeamMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
          </DialogHeader>
          {editingTeamMember && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={editingTeamMember.company?.logo_url || undefined} />
                  <AvatarFallback>
                    {editingTeamMember.company?.name?.substring(0, 2) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingTeamMember.company?.name || editingTeamMember.contact?.name}</p>
                  <p className="text-sm text-muted-foreground">{editingTeamMember.contact?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Select
                    value={editingTeamMember.specialty || ''}
                    onValueChange={(v) => setEditingTeamMember({ ...editingTeamMember, specialty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select
                    value={editingTeamMember.role}
                    onValueChange={(v) => setEditingTeamMember({ ...editingTeamMember, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Notes sur ce membre..."
                  value={editingTeamMember.notes || ''}
                  onChange={(e) => setEditingTeamMember({ ...editingTeamMember, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeamMember(null)}>
              Annuler
            </Button>
            <Button onClick={() => {
              if (editingTeamMember) {
                updateTeamMember.mutate({
                  id: editingTeamMember.id,
                  specialty: editingTeamMember.specialty,
                  role: editingTeamMember.role,
                  notes: editingTeamMember.notes,
                });
                setEditingTeamMember(null);
              }
            }}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Invitation Dialog */}
      <Dialog open={!!singleInviteTarget} onOpenChange={() => setSingleInviteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envoyer une invitation
            </DialogTitle>
          </DialogHeader>
          {singleInviteTarget && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarFallback>{singleInviteTarget.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{singleInviteTarget.name}</p>
                  <p className="text-sm text-muted-foreground">{singleInviteTarget.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objet</Label>
                <Input
                  value={singleInviteSubject}
                  onChange={(e) => setSingleInviteSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={singleInviteBody}
                  onChange={(e) => setSingleInviteBody(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleInviteTarget(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendSingleInvite}
              disabled={sendInvitation.isPending || sendBulkInvitations.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>{deleteConfirm?.name}</strong> {deleteConfirm?.type === 'candidate' ? 'du pipeline' : 'de l\'équipe'} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Invitation Dialog */}
      {tender && (
        <BulkInvitationDialog
          open={showBulkInviteDialog}
          onOpenChange={setShowBulkInviteDialog}
          candidates={candidatesToInvite}
          tender={tender}
          onSend={async (data) => {
            await sendBulkInvitations.mutateAsync(data);
          }}
          isSending={sendBulkInvitations.isPending}
        />
      )}

      {/* Partner Prefilter Sheet */}
      <Sheet open={showPrefilterPanel} onOpenChange={setShowPrefilterPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Constitution d'équipe</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <PartnerPrefilterPanel
              requiredSpecialties={requiredSpecialties.length > 0 ? requiredSpecialties : ['architecte', 'structure', 'fluides', 'thermique']}
              existingPartnerIds={[...candidates.map(c => c.company_id).filter(Boolean) as string[], ...teamMembers.map(m => m.company_id).filter(Boolean)]}
              tenderLocation={tender?.location}
              onAddPartners={(partners) => {
                partners.forEach(p => {
                  addCandidate.mutate({
                    specialty: p.specialty,
                    role: p.role as TenderTeamRole,
                    company_id: p.company_id,
                    contact_id: p.contact_id,
                  });
                });
                setShowPrefilterPanel(false);
              }}
              onClose={() => setShowPrefilterPanel(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Partner Proposal Email Dialog */}
      {tender && (
        <PartnerProposalEmailDialog
          open={!!proposalEmailTarget}
          onOpenChange={(open) => !open && setProposalEmailTarget(null)}
          tender={tender}
          partner={proposalEmailTarget}
          onSent={() => setProposalEmailTarget(null)}
        />
      )}
    </div>
  );
}

// Pipeline View Component
function PipelineView({
  candidates,
  candidatesBySpecialty,
  stats,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  estimatedBudget,
  selectedCandidates,
  onSelectionChange,
  onAddCandidate,
  onAddWithSpecialty,
  onEditCandidate,
  onUpdateCandidate,
  onBulkUpdateStatus,
  onBulkRemove,
  onBulkConfirm,
  onRemoveCandidate,
  onConfirmToTeam,
  onSendInvite,
  onBulkInvite,
  isLoading,
}: {
  candidates: PartnerCandidate[];
  candidatesBySpecialty: Record<string, PartnerCandidate[]>;
  stats: { total: number; suggested: number; contacted: number; interested: number; confirmed: number; declined: number };
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  estimatedBudget?: number | null;
  selectedCandidates: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onAddCandidate: () => void;
  onAddWithSpecialty: (specialty: string) => void;
  onEditCandidate: (candidate: PartnerCandidate) => void;
  onUpdateCandidate: (id: string, updates: Partial<PartnerCandidate>) => void;
  onBulkUpdateStatus: (ids: string[], status: string) => void;
  onBulkRemove: (ids: string[]) => void;
  onBulkConfirm: (ids: string[]) => void;
  onRemoveCandidate: (id: string, name: string) => void;
  onConfirmToTeam: (id: string) => void;
  onSendInvite: (candidate: PartnerCandidate) => void;
  onBulkInvite: () => void;
  isLoading: boolean;
}) {
  const toggleCandidate = (id: string) => {
    const newSet = new Set(selectedCandidates);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };

  const toggleAll = () => {
    if (selectedCandidates.size === candidates.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(candidates.map(c => c.id)));
    }
  };

  const selectedArray = Array.from(selectedCandidates);
  const hasSelection = selectedCandidates.size > 0;
  const canBulkConfirm = selectedArray.some(id => {
    const c = candidates.find(cand => cand.id === id);
    return c && (c.status === 'interested' || c.status === 'contacted');
  });
  const canBulkInvite = selectedArray.some(id => {
    const c = candidates.find(cand => cand.id === id);
    return c?.contact?.email && c.status === 'suggested';
  });

  if (stats.total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun partenaire dans le pipeline</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Commencez à constituer votre équipe en ajoutant des partenaires potentiels depuis votre CRM.
            Vous pourrez ensuite les contacter en masse avec une synthèse du marché.
          </p>
          <Button onClick={onAddCandidate}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un partenaire
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="suggested">Suggérés</SelectItem>
            <SelectItem value="contacted">Contactés</SelectItem>
            <SelectItem value="interested">Intéressés</SelectItem>
            <SelectItem value="confirmed">Confirmés</SelectItem>
            <SelectItem value="declined">Déclinés</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={toggleAll} title={selectedCandidates.size === candidates.length ? "Tout désélectionner" : "Tout sélectionner"}>
          {selectedCandidates.size === candidates.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedCandidates.size} sélectionné(s)</Badge>
              <Button variant="ghost" size="sm" onClick={() => onSelectionChange(new Set())}>
                Annuler
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {canBulkInvite && (
                <Button size="sm" variant="outline" onClick={onBulkInvite}>
                  <Send className="h-4 w-4 mr-1" />
                  Inviter
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Changer statut
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onBulkUpdateStatus(selectedArray, 'suggested')}>
                    Suggéré
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkUpdateStatus(selectedArray, 'contacted')}>
                    Contacté
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkUpdateStatus(selectedArray, 'interested')}>
                    Intéressé
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkUpdateStatus(selectedArray, 'confirmed')}>
                    Confirmé
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkUpdateStatus(selectedArray, 'declined')}>
                    Décliné
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {canBulkConfirm && (
                <Button size="sm" variant="outline" className="text-green-600" onClick={() => onBulkConfirm(selectedArray)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Confirmer équipe
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => onBulkRemove(selectedArray)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Suggérés" value={stats.suggested} color="bg-muted" />
        <StatCard label="Contactés" value={stats.contacted} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard label="Intéressés" value={stats.interested} color="bg-amber-100 dark:bg-amber-900/30" />
        <StatCard label="Confirmés" value={stats.confirmed} color="bg-green-100 dark:bg-green-900/30" />
        <StatCard label="Déclinés" value={stats.declined} color="bg-red-100 dark:bg-red-900/30" />
      </div>

      {/* By Specialty */}
      <div className="space-y-4">
        {Object.keys(candidatesBySpecialty).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Aucun résultat pour cette recherche</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(candidatesBySpecialty).map(([specialty, specCandidates]) => (
            <Card key={specialty}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {SPECIALTIES.find(s => s.value === specialty)?.label || specialty}
                    <Badge variant="secondary">{specCandidates.length}</Badge>
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onAddWithSpecialty(specialty)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {specCandidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.id}
                    candidate={candidate}
                    estimatedBudget={estimatedBudget}
                    isSelected={selectedCandidates.has(candidate.id)}
                    onToggleSelect={() => toggleCandidate(candidate.id)}
                    onEdit={() => onEditCandidate(candidate)}
                    onUpdateStatus={(status) => onUpdateCandidate(candidate.id, { status: status as any })}
                    onRemove={() => onRemoveCandidate(candidate.id, candidate.company?.name || candidate.contact?.name || 'ce partenaire')}
                    onConfirmToTeam={() => onConfirmToTeam(candidate.id)}
                    onSendInvite={() => onSendInvite(candidate)}
                  />
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button variant="outline" className="w-full" onClick={onAddCandidate}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un partenaire
      </Button>
    </div>
  );
}

// Stat Card
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className={cn("py-3 px-4", color)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

// Candidate Row
function CandidateRow({
  candidate,
  estimatedBudget,
  isSelected,
  onToggleSelect,
  onEdit,
  onUpdateStatus,
  onRemove,
  onConfirmToTeam,
  onSendInvite,
}: {
  candidate: PartnerCandidate;
  estimatedBudget?: number | null;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onUpdateStatus: (status: string) => void;
  onRemove: () => void;
  onConfirmToTeam: () => void;
  onSendInvite: () => void;
}) {
  const feeAmount = estimatedBudget && candidate.fee_percentage
    ? (estimatedBudget * candidate.fee_percentage / 100)
    : null;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      isSelected ? "bg-primary/10 border-primary/30" : "bg-muted/30"
    )}>
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={onToggleSelect}
        className="shrink-0"
      />
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={candidate.company?.logo_url || undefined} />
        <AvatarFallback>
          {candidate.company?.name?.substring(0, 2) || candidate.contact?.name?.substring(0, 2) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {candidate.company?.name || candidate.contact?.name || 'Non défini'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {candidate.contact?.email && (
            <span className="truncate max-w-[150px]">{candidate.contact.email}</span>
          )}
          {candidate.fee_percentage && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px]">
                  <Euro className="h-3 w-3 mr-0.5" />
                  {candidate.fee_percentage}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {feeAmount ? `≈ ${feeAmount.toLocaleString('fr-FR')}€ HT` : 'Montant non calculable'}
              </TooltipContent>
            </Tooltip>
          )}
          {candidate.invitation_sent_at && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Mail className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Invitation envoyée le {new Date(candidate.invitation_sent_at).toLocaleDateString('fr-FR')}
              </TooltipContent>
            </Tooltip>
          )}
          {/* Notes indicator */}
          {candidate.response_notes && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                  <StickyNote className="h-3 w-3 text-amber-600" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <div className="space-y-1">
                  <p className="font-medium text-xs">Notes de réponse</p>
                  <p className="text-xs whitespace-pre-wrap">{candidate.response_notes}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <Select value={candidate.status} onValueChange={onUpdateStatus}>
        <SelectTrigger className={cn("w-[130px] h-8", CANDIDATE_STATUS_COLORS[candidate.status])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="suggested">Suggéré</SelectItem>
          <SelectItem value="contacted">Contacté</SelectItem>
          <SelectItem value="interested">Intéressé</SelectItem>
          <SelectItem value="confirmed">Confirmé</SelectItem>
          <SelectItem value="declined">Décliné</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          {candidate.contact?.email && (
            <>
              <DropdownMenuItem onClick={onSendInvite}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer une invitation
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`mailto:${candidate.contact.email}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans client mail
                </a>
              </DropdownMenuItem>
            </>
          )}
          {candidate.contact?.phone && (
            <DropdownMenuItem asChild>
              <a href={`tel:${candidate.contact.phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Appeler ({candidate.contact.phone})
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {(candidate.status === 'interested' || candidate.status === 'contacted' || candidate.status === 'suggested') && (
            <DropdownMenuItem onClick={onConfirmToTeam} className="text-green-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmer dans l'équipe
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Retirer du pipeline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Team View Component
function TeamView({
  teamMembers,
  teamByRole,
  onEditMember,
  onRemoveMember,
  onSendInvite,
  isLoading,
}: {
  teamMembers: any[];
  teamByRole: Record<string, any[]>;
  onEditMember: (member: any) => void;
  onRemoveMember: (id: string, name: string) => void;
  onSendInvite: (member: any) => void;
  isLoading: boolean;
}) {
  const roles: TenderTeamRole[] = ['mandataire', 'cotraitant', 'sous_traitant'];

  if (teamMembers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun membre confirmé</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Les partenaires confirmés depuis le pipeline apparaîtront ici, ou ajoutez-en directement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {roles.map((role) => (
        <Card key={role}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>{TEAM_ROLE_LABELS[role]}</span>
              <Badge variant="secondary">{teamByRole[role]?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamByRole[role]?.map((member: any) => (
              <div 
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 group"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.company?.logo_url || undefined} />
                  <AvatarFallback>
                    {member.company?.name?.[0] || member.contact?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {member.company?.name || member.contact?.name || 'Non défini'}
                    </p>
                    {/* Notes indicator for team members */}
                    {member.notes && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-[10px] gap-1 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                            <StickyNote className="h-3 w-3 text-amber-600" />
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <div className="space-y-1">
                            <p className="font-medium text-xs">Notes</p>
                            <p className="text-xs whitespace-pre-wrap">{member.notes}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.specialty && (
                      <p className="text-xs text-muted-foreground">
                        {SPECIALTIES.find(s => s.value === member.specialty)?.label || member.specialty}
                      </p>
                    )}
                    {member.contact?.email && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        • {member.contact.email}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={member.status} />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditMember(member)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    {member.contact?.email && (
                      <>
                        <DropdownMenuItem onClick={() => onSendInvite(member)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Envoyer une invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${member.contact.email}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ouvrir dans client mail
                          </a>
                        </DropdownMenuItem>
                      </>
                    )}
                    {member.contact?.phone && (
                      <DropdownMenuItem asChild>
                        <a href={`tel:${member.contact.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler ({member.contact.phone})
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onRemoveMember(member.id, member.company?.name || member.contact?.name || 'ce membre')} 
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Retirer de l'équipe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {(!teamByRole[role] || teamByRole[role].length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun {TEAM_ROLE_LABELS[role].toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { icon: Clock, label: "En attente", className: "bg-muted text-muted-foreground" },
    accepted: { icon: UserCheck, label: "Confirmé", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    declined: { icon: UserX, label: "Décliné", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  }[status] || { icon: Clock, label: status, className: "bg-muted" };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
