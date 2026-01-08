import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTenderTeam } from "@/hooks/useTenderTeam";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { TEAM_ROLE_LABELS, SPECIALTIES, type TenderTeamRole } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface TenderTeamTabProps {
  tenderId: string;
}

export function TenderTeamTab({ tenderId }: TenderTeamTabProps) {
  const { teamMembers, teamByRole, isLoading, addTeamMember, updateTeamMember, removeTeamMember, sendInvitation } = useTenderTeam(tenderId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    role: "cotraitant" as TenderTeamRole,
    specialty: "",
    company_id: "",
    contact_id: "",
  });
  const [inviteData, setInviteData] = useState({
    subject: "",
    body: "",
  });

  const handleAddMember = () => {
    addTeamMember.mutate({
      role: newMember.role,
      specialty: newMember.specialty || undefined,
      company_id: newMember.company_id || undefined,
      contact_id: newMember.contact_id || undefined,
    });
    setShowAddDialog(false);
    setNewMember({ role: "cotraitant", specialty: "", company_id: "", contact_id: "" });
  };

  const handleOpenInvite = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (member) {
      setSelectedMemberId(memberId);
      setInviteData({
        subject: `Invitation à rejoindre un groupement - Marché ${tenderId.slice(0, 8)}`,
        body: `Bonjour,

Nous constituons actuellement un groupement pour répondre à un appel d'offres et souhaiterions vous associer en tant que ${TEAM_ROLE_LABELS[member.role]}${member.specialty ? ` (${SPECIALTIES.find(s => s.value === member.specialty)?.label || member.specialty})` : ''}.

Pourriez-vous nous faire part de votre intérêt pour ce projet ?

Cordialement`,
      });
      setShowInviteDialog(true);
    }
  };

  const handleSendInvite = () => {
    if (selectedMemberId) {
      sendInvitation.mutate({
        memberId: selectedMemberId,
        subject: inviteData.subject,
        body: inviteData.body,
      });
      setShowInviteDialog(false);
    }
  };

  const roles: TenderTeamRole[] = ['mandataire', 'cotraitant', 'sous_traitant'];

  // Check for missing required specialties - using BET specialties keys
  const requiredSpecialties = ['architecte', 'structure', 'fluides', 'thermique'];
  const coveredSpecialties = teamMembers.map(m => m.specialty).filter(Boolean);
  const missingSpecialties = requiredSpecialties.filter(s => !coveredSpecialties.includes(s));

  return (
    <div className="space-y-6">
      {/* Missing Specialties Warning */}
      {missingSpecialties.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Compétences manquantes
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingSpecialties.map(s => (
                    <Badge key={s} variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                      {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team by Role */}
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
              {teamByRole[role]?.map((member) => (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.company?.logo_url || undefined} />
                    <AvatarFallback>
                      {member.company?.name?.[0] || member.contact?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.company?.name || member.contact?.name || 'Non défini'}
                    </p>
                    {member.specialty && (
                      <p className="text-xs text-muted-foreground">
                        {SPECIALTIES.find(s => s.value === member.specialty)?.label || member.specialty}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Select
                      value={member.role}
                      onValueChange={(newRole) => {
                        updateTeamMember.mutate({ 
                          id: member.id, 
                          role: newRole as TenderTeamRole 
                        });
                      }}
                    >
                      <SelectTrigger className="h-7 w-auto text-xs border-0 bg-transparent hover:bg-muted px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <StatusBadge status={member.status} />
                    {member.contact?.email && member.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenInvite(member.id)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeTeamMember.mutate(member.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setNewMember({ ...newMember, role });
                  setShowAddDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre à l'équipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={newMember.role}
                onValueChange={(v) => setNewMember({ ...newMember, role: v as TenderTeamRole })}
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

            <div className="space-y-2">
              <Label>Spécialité</Label>
              <Select
                value={newMember.specialty}
                onValueChange={(v) => setNewMember({ ...newMember, specialty: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entreprise (CRM)</Label>
              <Select
                value={newMember.company_id}
                onValueChange={(v) => setNewMember({ ...newMember, company_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact</Label>
              <Select
                value={newMember.contact_id}
                onValueChange={(v) => setNewMember({ ...newMember, contact_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts
                    .filter(c => !newMember.company_id || c.crm_company_id === newMember.company_id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {c.name}
                          {c.email && <span className="text-muted-foreground">({c.email})</span>}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMember} disabled={addTeamMember.isPending}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invitation Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envoyer une invitation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objet</Label>
              <Input
                value={inviteData.subject}
                onChange={(e) => setInviteData({ ...inviteData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={inviteData.body}
                onChange={(e) => setInviteData({ ...inviteData, body: e.target.value })}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendInvite} disabled={sendInvitation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
