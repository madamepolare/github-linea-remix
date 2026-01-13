import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Building2,
  X,
} from "lucide-react";
import { CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { CountryFlag } from "@/components/ui/country-flag";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { CompanyCategory } from "@/lib/crmTypes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CompanyInfoPanelProps {
  company: CRMCompanyEnriched;
  isEditing: boolean;
  editData: Partial<CRMCompanyEnriched>;
  onEditDataChange: (data: Partial<CRMCompanyEnriched>) => void;
  selectedCategory: CompanyCategory | "";
  onCategoryChange: (category: CompanyCategory | "") => void;
  selectedSpecialties: string[];
  onSpecialtiesChange: (specs: string[]) => void;
}

export function CompanyInfoPanel({
  company,
  isEditing,
  editData,
  onEditDataChange,
  selectedCategory,
  onCategoryChange,
  selectedSpecialties,
  onSpecialtiesChange,
}: CompanyInfoPanelProps) {
  const {
    companyCategories,
    companyTypes,
    betSpecialties,
    getCompanyTypesForCategory,
    getBetSpecialtyLabel,
    getBetSpecialtyColor,
  } = useCRMSettings();

  const getCompanyTypeLabel = (key: string) =>
    companyTypes.find((t) => t.key === key)?.label || key;

  const getCompanyTypeColor = (key: string) =>
    companyTypes.find((t) => t.key === key)?.color || "#3B82F6";

  const getNormalizedBetSpecialties = (
    industry: string | null | undefined,
    specs: string[] | null | undefined
  ) => {
    if (industry?.startsWith("bet_")) {
      const legacy = industry.slice("bet_".length);
      if (specs && specs.length > 0) return specs;
      return legacy ? [legacy] : [];
    }
    return specs || [];
  };

  const industry = company.industry || "";
  const specs = getNormalizedBetSpecialties(company.industry, company.bet_specialties);
  const isBet = industry === "bet" || industry.startsWith("bet_");

  return (
    <div className="space-y-4">
      {/* Company Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
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
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold truncate">{company.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isBet ? (
                  <>
                    <Badge variant="outline" className="gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCompanyTypeColor("bet") }}
                      />
                      BET
                    </Badge>
                    {specs.map((spec) => (
                      <Badge
                        key={spec}
                        className="text-white text-xs"
                        style={{ backgroundColor: getBetSpecialtyColor(spec) }}
                      >
                        {getBetSpecialtyLabel(spec)}
                      </Badge>
                    ))}
                  </>
                ) : industry ? (
                  <Badge variant="outline" className="gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCompanyTypeColor(industry) }}
                    />
                    {getCompanyTypeLabel(industry)}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type & Industry (editing) */}
      {isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Type d'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Catégorie</label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => {
                  onCategoryChange(v as CompanyCategory);
                  onEditDataChange({ ...editData, industry: v === "bet" ? "bet" : null });
                  onSpecialtiesChange([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {companyCategories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCategory !== "bet" && selectedCategory && (
              <div>
                <label className="text-xs text-muted-foreground">Type</label>
                <Select
                  value={(editData.industry as string) || ""}
                  onValueChange={(v) => onEditDataChange({ ...editData, industry: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getCompanyTypesForCategory(selectedCategory).map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedCategory === "bet" && (
              <div>
                <label className="text-xs text-muted-foreground">Spécialités BET</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-auto min-h-10 py-2">
                      {selectedSpecialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedSpecialties.map((spec) => (
                            <Badge
                              key={spec}
                              className="text-white text-xs gap-1"
                              style={{ backgroundColor: getBetSpecialtyColor(spec) }}
                            >
                              {getBetSpecialtyLabel(spec)}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSpecialtiesChange(selectedSpecialties.filter((s) => s !== spec));
                                }}
                              />
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sélectionner...</span>
                      )}
                      <span className="text-muted-foreground">▾</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {betSpecialties.map((spec) => (
                      <DropdownMenuCheckboxItem
                        key={spec.key}
                        checked={selectedSpecialties.includes(spec.key)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSpecialtiesChange([...selectedSpecialties, spec.key]);
                          } else {
                            onSpecialtiesChange(selectedSpecialties.filter((s) => s !== spec.key));
                          }
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: spec.color }}
                          />
                          {spec.label}
                        </span>
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
                onChange={(e) => onEditDataChange({ ...editData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input
                  value={editData.email || ""}
                  onChange={(e) => onEditDataChange({ ...editData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Téléphone</label>
                <Input
                  value={editData.phone || ""}
                  onChange={(e) => onEditDataChange({ ...editData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Site web</label>
                <Input
                  value={editData.website || ""}
                  onChange={(e) => onEditDataChange({ ...editData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email facturation</label>
                <Input
                  value={editData.billing_email || ""}
                  onChange={(e) => onEditDataChange({ ...editData, billing_email: e.target.value })}
                  placeholder="facturation@example.com"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {company.email}
                    </p>
                  </div>
                </a>
              )}
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {company.phone}
                    </p>
                  </div>
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Site web</p>
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {company.website}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
              {company.billing_email && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Facturation</p>
                    <p className="text-sm font-medium">{company.billing_email}</p>
                  </div>
                </div>
              )}
              {!company.email && !company.phone && !company.website && (
                <p className="text-sm text-muted-foreground italic p-2">Aucune coordonnée</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Adresse</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Adresse</label>
                <Input
                  value={editData.address || ""}
                  onChange={(e) => onEditDataChange({ ...editData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Code postal</label>
                  <Input
                    value={editData.postal_code || ""}
                    onChange={(e) => onEditDataChange({ ...editData, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ville</label>
                  <Input
                    value={editData.city || ""}
                    onChange={(e) => onEditDataChange({ ...editData, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Pays</label>
                <Input
                  value={editData.country || "France"}
                  onChange={(e) => onEditDataChange({ ...editData, country: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-2.5">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-500/10 text-slate-600 shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                {company.address && <p className="text-sm">{company.address}</p>}
                {(company.postal_code || company.city) && (
                  <p className="text-sm">
                    {company.postal_code} {company.city}
                  </p>
                )}
                {company.country && (
                  <div className="flex items-center gap-2 mt-1">
                    <CountryFlag country={company.country} size="sm" />
                    <span className="text-sm">{company.country}</span>
                  </div>
                )}
                {!company.address && !company.city && !company.country && (
                  <p className="text-sm text-muted-foreground italic">Aucune adresse</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editData.notes || ""}
              onChange={(e) => onEditDataChange({ ...editData, notes: e.target.value })}
              rows={4}
              placeholder="Notes sur cette entreprise..."
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {company.notes || "Aucune note"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground px-1">
        Créé le {format(new Date(company.created_at!), "d MMMM yyyy", { locale: fr })}
      </div>
    </div>
  );
}
