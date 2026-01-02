import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Users,
  Target,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  Plus,
  ExternalLink,
  Save,
  X,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useLeads, Lead } from "@/hooks/useLeads";
import {
  getCompanyTypeConfig,
  COMPANY_TYPE_CONFIG,
  CompanyType,
  COMPANY_CATEGORIES,
  CompanyCategory,
  BET_SPECIALTIES,
} from "@/lib/crmTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allCompanies, isLoading, updateCompany } = useCRMCompanies();
  const { contacts } = useContacts();
  const { leads } = useLeads();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CRMCompanyEnriched>>({});

  const [selectedCategory, setSelectedCategory] = useState<CompanyCategory | "">("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const company = allCompanies.find((c) => c.id === id);
  const companyContacts = contacts.filter((c) => c.crm_company_id === id);
  const companyLeads = leads.filter((l) => l.crm_company_id === id);
  const totalLeadValue = companyLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

  // Helper to find category from industry type
  const getCategoryFromIndustry = (industry: string | null | undefined): CompanyCategory | "" => {
    if (!industry) return "";
    for (const cat of COMPANY_CATEGORIES) {
      if (cat.types?.includes(industry as CompanyType)) return cat.id;
    }
    return "";
  };

  useEffect(() => {
    if (company) {
      setEditData(company);
      setSelectedCategory(getCategoryFromIndustry(company.industry));
      setSelectedSpecialties(company.bet_specialties || []);
    }
  }, [company]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSave = () => {
    if (company && editData) {
      updateCompany.mutate({
        id: company.id,
        ...editData,
        bet_specialties: selectedCategory === "bet" ? selectedSpecialties : null,
      });
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="p-6 max-w-6xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/crm")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au CRM
          </Button>
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Entreprise non trouvée</h2>
          </div>
        </div>
      </MainLayout>
    );
  }

  const typeConfig = getCompanyTypeConfig(company.industry);

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <div
              className={cn(
                "h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg",
                typeConfig.color
              )}
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-full w-full object-cover rounded-xl"
                />
              ) : (
                company.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", typeConfig.color)} />
                  {typeConfig.label}
                </Badge>
                {company.city && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (company) {
                      setEditData(company);
                      setSelectedCategory(getCategoryFromIndustry(company.industry));
                      setSelectedSpecialties(company.bet_specialties || []);
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={updateCompany.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companyContacts.length}</p>
                <p className="text-sm text-muted-foreground">Contacts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{companyLeads.length}</p>
                <p className="text-sm text-muted-foreground">Opportunités</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalLeadValue > 0 ? formatCurrency(totalLeadValue) : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Pipeline</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Informations</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({companyContacts.length})</TabsTrigger>
            <TabsTrigger value="leads">Opportunités ({companyLeads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                {/* Type & Industry */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Type d'entreprise</h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className={selectedCategory === "bet" ? "space-y-2" : "grid grid-cols-2 gap-2"}>
                        <div>
                          <label className="text-xs text-muted-foreground">Catégorie</label>
                          <Select
                            value={selectedCategory}
                            onValueChange={(v) => {
                              setSelectedCategory(v as CompanyCategory);
                              setEditData({ ...editData, industry: null });
                              setSelectedSpecialties([]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedCategory !== "bet" && (
                          <div>
                            <label className="text-xs text-muted-foreground">Type</label>
                            <Select
                              value={(editData.industry as string) || ""}
                              onValueChange={(v) => setEditData({ ...editData, industry: v })}
                              disabled={!selectedCategory}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(selectedCategory
                                  ? COMPANY_CATEGORIES.find((c) => c.id === selectedCategory)?.types || []
                                  : []
                                ).map((type) => {
                                  const config = COMPANY_TYPE_CONFIG[type];
                                  return (
                                    <SelectItem key={type} value={type}>
                                      {config.label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {selectedCategory === "bet" && (
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Spécialités BET</label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-auto min-h-10 py-2">
                                {selectedSpecialties.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {selectedSpecialties.map((spec) => {
                                      const specialty = BET_SPECIALTIES.find((s) => s.value === spec);
                                      return (
                                        <Badge key={spec} className={cn("text-white text-xs gap-1", specialty?.color)}>
                                          {specialty?.label}
                                          <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedSpecialties((prev) => prev.filter((s) => s !== spec));
                                            }}
                                          />
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Sélectionnez une ou plusieurs spécialités</span>
                                )}
                                <span className="text-muted-foreground">▾</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                              {BET_SPECIALTIES.map((spec) => (
                                <DropdownMenuCheckboxItem
                                  key={spec.value}
                                  checked={selectedSpecialties.includes(spec.value)}
                                  onSelect={(e) => e.preventDefault()}
                                  onCheckedChange={() => {
                                    setSelectedSpecialties((prev) =>
                                      prev.includes(spec.value)
                                        ? prev.filter((s) => s !== spec.value)
                                        : [...prev, spec.value]
                                    );
                                  }}
                                >
                                  <Badge className={cn("text-white text-xs mr-2", spec.color)}>{spec.label}</Badge>
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-muted-foreground">URL du logo</label>
                        <Input
                          value={editData.logo_url || ""}
                          onChange={(e) => setEditData({ ...editData, logo_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", typeConfig.color)} />
                        {typeConfig.label}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Coordonnées</h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Email</label>
                        <Input
                          value={editData.email || ""}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Téléphone</label>
                        <Input
                          value={editData.phone || ""}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          placeholder="+33 1 23 45 67 89"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Site web</label>
                        <Input
                          value={editData.website || ""}
                          onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Email de facturation</label>
                        <Input
                          value={editData.billing_email || ""}
                          onChange={(e) => setEditData({ ...editData, billing_email: e.target.value })}
                          placeholder="facturation@example.com"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {company.email && (
                        <a
                          href={`mailto:${company.email}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{company.email}</span>
                        </a>
                      )}
                      {company.phone && (
                        <a
                          href={`tel:${company.phone}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{company.phone}</span>
                        </a>
                      )}
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate">{company.website}</span>
                          <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                        </a>
                      )}
                      {company.billing_email && (
                        <div className="flex items-center gap-3 p-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Facturation: {company.billing_email}</span>
                        </div>
                      )}
                      {!company.email && !company.phone && !company.website && (
                        <p className="text-sm text-muted-foreground">Aucune coordonnée</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Adresse</h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Adresse</label>
                        <Input
                          value={editData.address || ""}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Code postal</label>
                          <Input
                            value={editData.postal_code || ""}
                            onChange={(e) => setEditData({ ...editData, postal_code: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Ville</label>
                          <Input
                            value={editData.city || ""}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Pays</label>
                        <Input
                          value={editData.country || "France"}
                          onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      {company.address && <p>{company.address}</p>}
                      {(company.postal_code || company.city) && (
                        <p>
                          {company.postal_code} {company.city}
                        </p>
                      )}
                      {company.country && <p>{company.country}</p>}
                      {!company.address && !company.city && (
                        <p className="text-muted-foreground">Aucune adresse</p>
                      )}
                    </div>
                  )}
                </div>

                {(company.notes || isEditing) && (
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
                    {isEditing ? (
                      <Textarea
                        value={editData.notes || ""}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 pt-4 border-t text-xs text-muted-foreground">
                  Créé le {format(new Date(company.created_at), "d MMMM yyyy", { locale: fr })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Contacts</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {companyContacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aucun contact</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {companyContacts.map((contact) => (
                      <Link
                        key={contact.id}
                        to={`/crm/contacts/${contact.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {contact.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          {contact.role && (
                            <p className="text-xs text-muted-foreground">{contact.role}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {contact.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `mailto:${contact.email}`;
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {contact.phone && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `tel:${contact.phone}`;
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Opportunités</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Créer
                </Button>
              </CardHeader>
              <CardContent>
                {companyLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aucune opportunité</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {companyLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        to={`/crm/leads/${lead.id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lead.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {lead.estimated_value && <span>{formatCurrency(lead.estimated_value)}</span>}
                            {lead.probability && <span>• {lead.probability}%</span>}
                          </div>
                        </div>
                        {lead.stage && (
                          <Badge
                            style={{ backgroundColor: lead.stage.color || "#6366f1" }}
                            className="text-white text-xs shrink-0"
                          >
                            {lead.stage.name}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
