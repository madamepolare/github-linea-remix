import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useJobOffers, useCreateJobOffer, useUpdateJobOffer, contractTypeLabels, remotePolicyLabels, JobOffer } from "@/hooks/useJobOffers";
import { useJobApplications, useCreateJobApplication, useUpdateJobApplication, applicationStatusLabels, applicationStatusColors, JobApplication } from "@/hooks/useJobApplications";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { UserPlus, Plus, Briefcase, Users, MapPin, ExternalLink, Mail, Phone, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const offerStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publiée",
  paused: "Suspendue",
  closed: "Clôturée",
};

const offerStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-red-100 text-red-800",
};

export function RecruitmentTab() {
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  
  const [newOffer, setNewOffer] = useState<Partial<JobOffer>>({
    title: "",
    description: "",
    requirements: "",
    contract_type: "cdi",
    location: "",
    remote_policy: "hybrid",
    salary_min: undefined,
    salary_max: undefined,
  });

  const [newCandidate, setNewCandidate] = useState<Partial<JobApplication>>({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    linkedin_url: "",
    cover_letter: "",
  });

  const { data: offers, isLoading: offersLoading } = useJobOffers();
  const { data: applications, isLoading: applicationsLoading } = useJobApplications(selectedOffer?.id);
  const { data: members } = useTeamMembers();
  const { user } = useAuth();
  
  const createOffer = useCreateJobOffer();
  const updateOffer = useUpdateJobOffer();
  const createApplication = useCreateJobApplication();
  const updateApplication = useUpdateJobApplication();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const handleCreateOffer = async () => {
    if (!newOffer.title) return;
    await createOffer.mutateAsync(newOffer);
    setCreateOfferOpen(false);
    setNewOffer({
      title: "",
      description: "",
      requirements: "",
      contract_type: "cdi",
      location: "",
      remote_policy: "hybrid",
      salary_min: undefined,
      salary_max: undefined,
    });
  };

  const handlePublishOffer = async (id: string) => {
    await updateOffer.mutateAsync({
      id,
      status: "published",
      published_at: new Date().toISOString(),
    });
  };

  const handleAddCandidate = async () => {
    if (!selectedOffer || !newCandidate.candidate_name || !newCandidate.candidate_email) return;
    await createApplication.mutateAsync({
      ...newCandidate,
      job_offer_id: selectedOffer.id,
    });
    setAddCandidateOpen(false);
    setNewCandidate({
      candidate_name: "",
      candidate_email: "",
      candidate_phone: "",
      linkedin_url: "",
      cover_letter: "",
    });
  };

  const handleUpdateApplicationStatus = async (id: string, status: JobApplication["status"]) => {
    await updateApplication.mutateAsync({ id, status });
  };

  if (offersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Offres d'emploi</h2>
        {canManage && (
          <Button onClick={() => setCreateOfferOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une offre
          </Button>
        )}
      </div>

      {offers && offers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedOffer(offer)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{offer.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={offerStatusColors[offer.status]}>
                        {offerStatusLabels[offer.status]}
                      </Badge>
                      <Badge variant="outline">
                        {contractTypeLabels[offer.contract_type]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{offer.applications_count || 0}</span>
                  </div>
                </div>
                {offer.location && (
                  <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{offer.location}</span>
                    <span className="mx-1">•</span>
                    <span>{remotePolicyLabels[offer.remote_policy]}</span>
                  </div>
                )}
                {(offer.salary_min || offer.salary_max) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {offer.salary_min && offer.salary_max
                      ? `${offer.salary_min.toLocaleString()}€ - ${offer.salary_max.toLocaleString()}€`
                      : offer.salary_min
                      ? `À partir de ${offer.salary_min.toLocaleString()}€`
                      : `Jusqu'à ${offer.salary_max?.toLocaleString()}€`}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="Aucune offre d'emploi"
          description="Créez votre première offre pour commencer à recruter."
          action={canManage ? {
            label: "Créer une offre",
            onClick: () => setCreateOfferOpen(true),
          } : undefined}
        />
      )}

      {/* Create Offer Dialog */}
      <Dialog open={createOfferOpen} onOpenChange={setCreateOfferOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une offre d'emploi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Titre du poste</Label>
              <Input
                value={newOffer.title}
                onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                placeholder="Ex: Architecte Senior"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de contrat</Label>
                <Select
                  value={newOffer.contract_type}
                  onValueChange={(v) => setNewOffer({ ...newOffer, contract_type: v as JobOffer["contract_type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(contractTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Politique de télétravail</Label>
                <Select
                  value={newOffer.remote_policy}
                  onValueChange={(v) => setNewOffer({ ...newOffer, remote_policy: v as JobOffer["remote_policy"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(remotePolicyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input
                value={newOffer.location || ""}
                onChange={(e) => setNewOffer({ ...newOffer, location: e.target.value })}
                placeholder="Ex: Paris"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salaire min (€/an)</Label>
                <Input
                  type="number"
                  value={newOffer.salary_min || ""}
                  onChange={(e) => setNewOffer({ ...newOffer, salary_min: parseInt(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label>Salaire max (€/an)</Label>
                <Input
                  type="number"
                  value={newOffer.salary_max || ""}
                  onChange={(e) => setNewOffer({ ...newOffer, salary_max: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description du poste</Label>
              <Textarea
                value={newOffer.description || ""}
                onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                placeholder="Décrivez le poste, les missions..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Prérequis</Label>
              <Textarea
                value={newOffer.requirements || ""}
                onChange={(e) => setNewOffer({ ...newOffer, requirements: e.target.value })}
                placeholder="Compétences requises, expérience..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOfferOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateOffer} disabled={!newOffer.title || createOffer.isPending}>
              Créer l'offre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Detail Sheet */}
      <Sheet open={!!selectedOffer} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedOffer && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle>{selectedOffer.title}</SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={offerStatusColors[selectedOffer.status]}>
                        {offerStatusLabels[selectedOffer.status]}
                      </Badge>
                      <Badge variant="outline">
                        {contractTypeLabels[selectedOffer.contract_type]}
                      </Badge>
                    </div>
                  </div>
                  {canManage && selectedOffer.status === "draft" && (
                    <Button onClick={() => handlePublishOffer(selectedOffer.id)}>
                      Publier
                    </Button>
                  )}
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {selectedOffer.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedOffer.description}
                    </p>
                  </div>
                )}

                {selectedOffer.requirements && (
                  <div>
                    <h4 className="font-medium mb-2">Prérequis</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedOffer.requirements}
                    </p>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Candidatures ({applications?.length || 0})</h4>
                    {canManage && (
                      <Button size="sm" onClick={() => setAddCandidateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    )}
                  </div>

                  {applicationsLoading ? (
                    <Skeleton className="h-32" />
                  ) : applications && applications.length > 0 ? (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <Card
                          key={app.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{app.candidate_name}</p>
                                <p className="text-sm text-muted-foreground">{app.candidate_email}</p>
                              </div>
                              <Badge className={applicationStatusColors[app.status]}>
                                {applicationStatusLabels[app.status]}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune candidature pour le moment
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Candidate Dialog */}
      <Dialog open={addCandidateOpen} onOpenChange={setAddCandidateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une candidature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={newCandidate.candidate_name}
                onChange={(e) => setNewCandidate({ ...newCandidate, candidate_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newCandidate.candidate_email}
                onChange={(e) => setNewCandidate({ ...newCandidate, candidate_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={newCandidate.candidate_phone || ""}
                onChange={(e) => setNewCandidate({ ...newCandidate, candidate_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                value={newCandidate.linkedin_url || ""}
                onChange={(e) => setNewCandidate({ ...newCandidate, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={newCandidate.cover_letter || ""}
                onChange={(e) => setNewCandidate({ ...newCandidate, cover_letter: e.target.value })}
                placeholder="Notes sur le candidat..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCandidateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddCandidate}
              disabled={!newCandidate.candidate_name || !newCandidate.candidate_email || createApplication.isPending}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent>
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedApplication.candidate_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <a
                    href={`mailto:${selectedApplication.candidate_email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedApplication.candidate_email}
                  </a>
                  {selectedApplication.candidate_phone && (
                    <a
                      href={`tel:${selectedApplication.candidate_phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedApplication.candidate_phone}
                    </a>
                  )}
                </div>

                {selectedApplication.linkedin_url && (
                  <a
                    href={selectedApplication.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir le profil LinkedIn
                  </a>
                )}

                {selectedApplication.cover_letter && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="text-sm mt-1">{selectedApplication.cover_letter}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(v) => {
                      handleUpdateApplicationStatus(selectedApplication.id, v as JobApplication["status"]);
                      setSelectedApplication({ ...selectedApplication, status: v as JobApplication["status"] });
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(applicationStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
