import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Target,
  Edit2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { CRMCompany } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useLeads } from "@/hooks/useLeads";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface CompanyDetailSheetProps {
  company: CRMCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailSheet({ company, open, onOpenChange }: CompanyDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { contacts } = useContacts();
  const { leads } = useLeads();
  const { getCompanyTypeLabel, getCompanyTypeColor, getBetSpecialtyLabel } = useCRMSettings();

  if (!company) return null;

  const companyContacts = contacts.filter(c => c.crm_company_id === company.id);
  const companyLeads = leads.filter(l => l.crm_company_id === company.id);

  const totalLeadValue = companyLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: getCompanyTypeColor(company.industry || "") }}
            >
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover rounded-xl" />
              ) : (
                company.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl leading-tight truncate">{company.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                {company.industry && (
                  <Badge variant="secondary">
                    {getCompanyTypeLabel(company.industry)}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>

          {/* BET Specialties */}
          {company.bet_specialties && company.bet_specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {company.bet_specialties.map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs">
                  {getBetSpecialtyLabel(spec)}
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold">{companyContacts.length}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold">{companyLeads.length}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold">
                {totalLeadValue > 0 ? formatCurrency(totalLeadValue, { compact: true }) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Pipeline</p>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="text-xs">Infos</TabsTrigger>
            <TabsTrigger value="contacts" className="text-xs">Contacts</TabsTrigger>
            <TabsTrigger value="deals" className="text-xs">Affaires</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            {/* Contact Info */}
            <div className="space-y-3">
              {company.email && (
                <a href={`mailto:${company.email}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.email}</span>
                </a>
              )}
              {company.phone && (
                <a href={`tel:${company.phone}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.phone}</span>
                </a>
              )}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{company.website}</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                </a>
              )}
              {(company.address || company.city) && (
                <div className="flex items-start gap-3 p-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {company.address && <p>{company.address}</p>}
                    <p>
                      {company.postal_code} {company.city}
                      {company.country && company.country !== "France" && `, ${company.country}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Billing Info */}
            {company.billing_email && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Facturation</p>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.billing_email}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {company.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <p>Créé le {format(new Date(company.created_at), "d MMMM yyyy", { locale: fr })}</p>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="mt-0">
            <div className="space-y-2">
              {companyContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun contact</p>
                  <Button size="sm" variant="outline" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un contact
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {companyContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`mailto:${contact.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {contact.phone && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${contact.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deals" className="mt-0">
            <div className="space-y-2">
              {companyLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune opportunité</p>
                  <Button size="sm" variant="outline" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Créer une opportunité
                  </Button>
                </div>
              ) : (
                <AnimatePresence>
                  {companyLeads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium truncate">{lead.title}</p>
                        {lead.stage && (
                          <Badge 
                            style={{ backgroundColor: lead.stage.color || "#6366f1" }}
                            className="text-white text-2xs shrink-0"
                          >
                            {lead.stage.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {lead.estimated_value && (
                          <span>{formatCurrency(lead.estimated_value)}</span>
                        )}
                        {lead.probability && (
                          <span>• {lead.probability}%</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
