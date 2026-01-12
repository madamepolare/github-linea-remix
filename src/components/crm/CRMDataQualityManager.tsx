import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Users,
  Building2,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Merge,
  Eye,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Trash2,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Progress } from "@/components/ui/progress";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface DuplicateGroup<T> {
  items: T[];
  reason: string;
  field: string;
}

interface MissingFieldItem<T> {
  item: T;
  missingFields: { field: string; label: string; importance: "critical" | "important" | "optional" }[];
}

export function CRMDataQualityManager() {
  const navigate = useNavigate();
  const { allContacts, deleteContact, updateContact } = useContacts();
  const { allCompanies, deleteCompany, updateCompany } = useCRMCompanies();
  
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["duplicates", "missing"]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [autoCleanupDialogOpen, setAutoCleanupDialogOpen] = useState(false);
  const [isAutoCleanupRunning, setIsAutoCleanupRunning] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<{
    type: "contact" | "company";
    items: (Contact | CRMCompanyEnriched)[];
    keepId: string;
  } | null>(null);

  // Detect duplicate contacts
  const duplicateContacts = useMemo(() => {
    const groups: DuplicateGroup<Contact>[] = [];
    const processed = new Set<string>();

    // Check by email
    const emailMap = new Map<string, Contact[]>();
    allContacts.forEach((contact) => {
      if (contact.email) {
        const email = contact.email.toLowerCase().trim();
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(contact);
      }
    });
    emailMap.forEach((contacts, email) => {
      if (contacts.length > 1) {
        contacts.forEach((c) => processed.add(c.id));
        groups.push({ items: contacts, reason: `Email identique: ${email}`, field: "email" });
      }
    });

    // Check by phone (normalize phone numbers)
    const phoneMap = new Map<string, Contact[]>();
    allContacts.forEach((contact) => {
      if (contact.phone && !processed.has(contact.id)) {
        const phone = contact.phone.replace(/[\s\-\.]/g, "");
        if (phone.length >= 8) {
          if (!phoneMap.has(phone)) phoneMap.set(phone, []);
          phoneMap.get(phone)!.push(contact);
        }
      }
    });
    phoneMap.forEach((contacts, phone) => {
      if (contacts.length > 1) {
        contacts.forEach((c) => processed.add(c.id));
        groups.push({ items: contacts, reason: `Téléphone identique`, field: "phone" });
      }
    });

    // Check by similar name (Levenshtein-like)
    const remaining = allContacts.filter((c) => !processed.has(c.id));
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        const name1 = remaining[i].name.toLowerCase().trim();
        const name2 = remaining[j].name.toLowerCase().trim();
        if (name1 === name2 || (name1.length > 5 && name2.length > 5 && 
            (name1.includes(name2) || name2.includes(name1)))) {
          if (!processed.has(remaining[i].id) && !processed.has(remaining[j].id)) {
            processed.add(remaining[i].id);
            processed.add(remaining[j].id);
            groups.push({ 
              items: [remaining[i], remaining[j]], 
              reason: `Noms similaires`, 
              field: "name" 
            });
          }
        }
      }
    }

    return groups;
  }, [allContacts]);

  // Detect duplicate companies
  const duplicateCompanies = useMemo(() => {
    const groups: DuplicateGroup<CRMCompanyEnriched>[] = [];
    const processed = new Set<string>();

    // Check by SIRET (using type assertion since siret exists in DB but not in TS type)
    const siretMap = new Map<string, CRMCompanyEnriched[]>();
    allCompanies.forEach((company) => {
      const siret = (company as any).siret;
      if (siret) {
        const normalizedSiret = siret.replace(/\s/g, "");
        if (!siretMap.has(normalizedSiret)) siretMap.set(normalizedSiret, []);
        siretMap.get(normalizedSiret)!.push(company);
      }
    });
    siretMap.forEach((companies, siret) => {
      if (companies.length > 1) {
        companies.forEach((c) => processed.add(c.id));
        groups.push({ items: companies, reason: `SIRET identique: ${siret}`, field: "siret" });
      }
    });

    // Check by email
    const emailMap = new Map<string, CRMCompanyEnriched[]>();
    allCompanies.forEach((company) => {
      if (company.email && !processed.has(company.id)) {
        const email = company.email.toLowerCase().trim();
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(company);
      }
    });
    emailMap.forEach((companies) => {
      if (companies.length > 1) {
        companies.forEach((c) => processed.add(c.id));
        groups.push({ items: companies, reason: `Email identique`, field: "email" });
      }
    });

    // Check by name similarity
    const remaining = allCompanies.filter((c) => !processed.has(c.id));
    for (let i = 0; i < remaining.length; i++) {
      for (let j = i + 1; j < remaining.length; j++) {
        const name1 = remaining[i].name.toLowerCase().trim();
        const name2 = remaining[j].name.toLowerCase().trim();
        if (name1 === name2) {
          if (!processed.has(remaining[i].id) && !processed.has(remaining[j].id)) {
            processed.add(remaining[i].id);
            processed.add(remaining[j].id);
            groups.push({ 
              items: [remaining[i], remaining[j]], 
              reason: `Noms identiques`, 
              field: "name" 
            });
          }
        }
      }
    }

    return groups;
  }, [allCompanies]);

  // Detect missing fields for contacts
  const contactsMissingFields = useMemo(() => {
    const items: MissingFieldItem<Contact>[] = [];

    allContacts.forEach((contact) => {
      const missing: MissingFieldItem<Contact>["missingFields"] = [];
      
      if (!contact.email) {
        missing.push({ field: "email", label: "Email", importance: "critical" });
      }
      if (!contact.phone) {
        missing.push({ field: "phone", label: "Téléphone", importance: "important" });
      }
      if (!contact.crm_company_id) {
        missing.push({ field: "company", label: "Entreprise", importance: "important" });
      }
      if (!contact.role) {
        missing.push({ field: "role", label: "Fonction", importance: "optional" });
      }
      if (!contact.contact_type) {
        missing.push({ field: "contact_type", label: "Type de contact", importance: "optional" });
      }

      if (missing.length > 0) {
        items.push({ item: contact, missingFields: missing });
      }
    });

    // Sort by number of critical missing fields
    return items.sort((a, b) => {
      const aCritical = a.missingFields.filter((f) => f.importance === "critical").length;
      const bCritical = b.missingFields.filter((f) => f.importance === "critical").length;
      return bCritical - aCritical;
    });
  }, [allContacts]);

  // Detect missing fields for companies
  const companiesMissingFields = useMemo(() => {
    const items: MissingFieldItem<CRMCompanyEnriched>[] = [];

    allCompanies.forEach((company) => {
      const missing: MissingFieldItem<CRMCompanyEnriched>["missingFields"] = [];
      
      if (!company.email) {
        missing.push({ field: "email", label: "Email", importance: "critical" });
      }
      if (!company.phone) {
        missing.push({ field: "phone", label: "Téléphone", importance: "important" });
      }
      if (!company.address || !company.city) {
        missing.push({ field: "address", label: "Adresse", importance: "important" });
      }
      if (!company.industry) {
        missing.push({ field: "industry", label: "Secteur/Type", importance: "optional" });
      }
      if (!(company as any).siret) {
        missing.push({ field: "siret", label: "SIRET", importance: "optional" });
      }

      if (missing.length > 0) {
        items.push({ item: company, missingFields: missing });
      }
    });

    return items.sort((a, b) => {
      const aCritical = a.missingFields.filter((f) => f.importance === "critical").length;
      const bCritical = b.missingFields.filter((f) => f.importance === "critical").length;
      return bCritical - aCritical;
    });
  }, [allCompanies]);

  // Calculate quality score
  const qualityScore = useMemo(() => {
    const totalItems = allContacts.length + allCompanies.length;
    if (totalItems === 0) return 100;

    const duplicateCount = duplicateContacts.reduce((sum, g) => sum + g.items.length, 0) +
      duplicateCompanies.reduce((sum, g) => sum + g.items.length, 0);
    
    const criticalMissing = contactsMissingFields.filter((i) => 
      i.missingFields.some((f) => f.importance === "critical")).length +
      companiesMissingFields.filter((i) => 
        i.missingFields.some((f) => f.importance === "critical")).length;

    const score = Math.max(0, 100 - (duplicateCount * 5) - (criticalMissing * 3));
    return Math.round(score);
  }, [duplicateContacts, duplicateCompanies, contactsMissingFields, companiesMissingFields, allContacts.length, allCompanies.length]);

  const totalIssues = duplicateContacts.length + duplicateCompanies.length + 
    contactsMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length +
    companiesMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleMerge = async () => {
    if (!selectedDuplicates) return;

    const { type, items, keepId } = selectedDuplicates;
    const toDelete = items.filter((item) => item.id !== keepId);

    try {
      for (const item of toDelete) {
        if (type === "contact") {
          await deleteContact.mutateAsync(item.id);
        } else {
          await deleteCompany.mutateAsync(item.id);
        }
      }
      setMergeDialogOpen(false);
      setSelectedDuplicates(null);
    } catch (error) {
      console.error("Error merging:", error);
    }
  };

  // Auto-cleanup: keep the first item in each duplicate group and delete the rest
  const handleAutoCleanup = async () => {
    setIsAutoCleanupRunning(true);
    let deletedCount = 0;

    try {
      // Clean up duplicate contacts
      for (const group of duplicateContacts) {
        const toDelete = group.items.slice(1); // Keep the first, delete the rest
        for (const contact of toDelete) {
          try {
            await deleteContact.mutateAsync(contact.id);
            deletedCount++;
          } catch (error) {
            console.error("Error deleting contact:", error);
          }
        }
      }

      // Clean up duplicate companies
      for (const group of duplicateCompanies) {
        const toDelete = group.items.slice(1);
        for (const company of toDelete) {
          try {
            await deleteCompany.mutateAsync(company.id);
            deletedCount++;
          } catch (error) {
            console.error("Error deleting company:", error);
          }
        }
      }

      setAutoCleanupDialogOpen(false);
    } catch (error) {
      console.error("Error during auto-cleanup:", error);
    } finally {
      setIsAutoCleanupRunning(false);
    }
  };

  const totalDuplicatesToDelete = duplicateContacts.reduce((sum, g) => sum + g.items.length - 1, 0) +
    duplicateCompanies.reduce((sum, g) => sum + g.items.length - 1, 0);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "gap-2",
          totalIssues > 0 && "border-yellow-500/50 text-yellow-600 hover:bg-yellow-50"
        )}
      >
        <Sparkles className="h-4 w-4" />
        Qualité
        {totalIssues > 0 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 ml-1">
            {totalIssues}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-xl w-full">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gestionnaire de qualité CRM
            </SheetTitle>
            <SheetDescription>
              Détectez les doublons et les informations manquantes
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {/* Quality Score */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Score de qualité</span>
                  <span className={cn("text-2xl font-bold", getScoreColor(qualityScore))}>
                    {qualityScore}%
                  </span>
                </div>
                <Progress 
                  value={qualityScore} 
                  className="h-2"
                  style={{
                    ["--progress-background" as any]: qualityScore >= 80 
                      ? "rgb(34 197 94)" 
                      : qualityScore >= 60 
                        ? "rgb(234 179 8)" 
                        : "rgb(239 68 68)"
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{allContacts.length} contacts</span>
                  <span>{allCompanies.length} entreprises</span>
                </div>
              </CardContent>
            </Card>

            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-4 pr-4">
                {/* Duplicates Section */}
                <Collapsible
                  open={expandedSections.includes("duplicates")}
                  onOpenChange={() => toggleSection("duplicates")}
                >
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Doublons potentiels
                            {(duplicateContacts.length + duplicateCompanies.length) > 0 && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                {duplicateContacts.length + duplicateCompanies.length}
                              </Badge>
                            )}
                          </CardTitle>
                          {expandedSections.includes("duplicates") ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mt-2">
                      {duplicateContacts.length === 0 && duplicateCompanies.length === 0 ? (
                        <Card className="border-dashed">
                          <CardContent className="py-6 text-center text-muted-foreground">
                            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">Aucun doublon détecté</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          {/* Auto-cleanup button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 mb-2"
                            onClick={() => setAutoCleanupDialogOpen(true)}
                          >
                            <Zap className="h-4 w-4" />
                            Nettoyage automatique ({totalDuplicatesToDelete} à supprimer)
                          </Button>
                          {duplicateContacts.map((group, index) => (
                            <Card key={`contact-${index}`} className="border-yellow-200 bg-yellow-50/50">
                              <CardContent className="py-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{group.reason}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setSelectedDuplicates({
                                        type: "contact",
                                        items: group.items,
                                        keepId: group.items[0].id,
                                      });
                                      setMergeDialogOpen(true);
                                    }}
                                  >
                                    <Merge className="h-3 w-3 mr-1" />
                                    Fusionner
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {group.items.map((contact) => (
                                    <div
                                      key={contact.id}
                                      className="flex items-center gap-2 p-2 rounded bg-background/50 cursor-pointer hover:bg-background"
                                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                                    >
                                      <Avatar className="h-7 w-7">
                                        <AvatarImage src={contact.avatar_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {contact.email || contact.phone || "—"}
                                        </p>
                                      </div>
                                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {duplicateCompanies.map((group, index) => (
                            <Card key={`company-${index}`} className="border-yellow-200 bg-yellow-50/50">
                              <CardContent className="py-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{group.reason}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setSelectedDuplicates({
                                        type: "company",
                                        items: group.items,
                                        keepId: group.items[0].id,
                                      });
                                      setMergeDialogOpen(true);
                                    }}
                                  >
                                    <Merge className="h-3 w-3 mr-1" />
                                    Fusionner
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {group.items.map((company) => (
                                    <div
                                      key={company.id}
                                      className="flex items-center gap-2 p-2 rounded bg-background/50 cursor-pointer hover:bg-background"
                                      onClick={() => navigate(`/crm/companies/${company.id}`)}
                                    >
                                      <div className="h-7 w-7 rounded bg-muted flex items-center justify-center">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{company.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {company.city || company.email || "—"}
                                        </p>
                                      </div>
                                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Missing Fields Section */}
                <Collapsible
                  open={expandedSections.includes("missing")}
                  onOpenChange={() => toggleSection("missing")}
                >
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Champs manquants
                            {(contactsMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length +
                              companiesMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length) > 0 && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                {contactsMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length +
                                  companiesMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length}
                              </Badge>
                            )}
                          </CardTitle>
                          {expandedSections.includes("missing") ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mt-2">
                      {/* Contacts with critical missing fields */}
                      {contactsMissingFields
                        .filter((i) => i.missingFields.some((f) => f.importance === "critical"))
                        .slice(0, 10)
                        .map((item) => (
                          <Card key={item.item.id} className="border-orange-200 bg-orange-50/50">
                            <CardContent className="py-3">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => navigate(`/crm/contacts/${item.item.id}`)}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={item.item.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {item.item.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.item.name}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.missingFields.map((field) => (
                                      <Badge
                                        key={field.field}
                                        variant="outline"
                                        className={cn(
                                          "text-[10px] h-5",
                                          field.importance === "critical" && "border-red-300 bg-red-50 text-red-700",
                                          field.importance === "important" && "border-yellow-300 bg-yellow-50 text-yellow-700",
                                          field.importance === "optional" && "border-gray-200 bg-gray-50 text-gray-600"
                                        )}
                                      >
                                        {field.label}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                      {/* Companies with critical missing fields */}
                      {companiesMissingFields
                        .filter((i) => i.missingFields.some((f) => f.importance === "critical"))
                        .slice(0, 10)
                        .map((item) => (
                          <Card key={item.item.id} className="border-orange-200 bg-orange-50/50">
                            <CardContent className="py-3">
                              <div
                                className="flex items-center gap-3 cursor-pointer"
                                onClick={() => navigate(`/crm/companies/${item.item.id}`)}
                              >
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.item.name}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.missingFields.map((field) => (
                                      <Badge
                                        key={field.field}
                                        variant="outline"
                                        className={cn(
                                          "text-[10px] h-5",
                                          field.importance === "critical" && "border-red-300 bg-red-50 text-red-700",
                                          field.importance === "important" && "border-yellow-300 bg-yellow-50 text-yellow-700",
                                          field.importance === "optional" && "border-gray-200 bg-gray-50 text-gray-600"
                                        )}
                                      >
                                        {field.label}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                      {contactsMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length === 0 &&
                        companiesMissingFields.filter((i) => i.missingFields.some((f) => f.importance === "critical")).length === 0 && (
                        <Card className="border-dashed">
                          <CardContent className="py-6 text-center text-muted-foreground">
                            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            <p className="text-sm">Aucun champ critique manquant</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Merge Dialog */}
      <AlertDialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fusionner les doublons</AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez l'entrée à conserver. Les autres seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedDuplicates && (
            <div className="space-y-2 my-4">
              {selectedDuplicates.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedDuplicates.keepId === item.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() =>
                    setSelectedDuplicates({ ...selectedDuplicates, keepId: item.id })
                  }
                >
                  {selectedDuplicates.type === "contact" ? (
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={(item as Contact).avatar_url || undefined} />
                      <AvatarFallback>
                        {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(item as any).email || (item as any).phone || (item as any).city || "—"}
                    </p>
                  </div>
                  {selectedDuplicates.keepId === item.id && (
                    <Badge className="bg-primary">Conserver</Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleMerge}>
              Fusionner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto-Cleanup Dialog */}
      <AlertDialog open={autoCleanupDialogOpen} onOpenChange={setAutoCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Nettoyage automatique des doublons
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer automatiquement {totalDuplicatesToDelete} entrée(s) en double 
              en conservant la première entrée de chaque groupe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Résumé des suppressions :</p>
                <ul className="list-disc list-inside space-y-1">
                  {duplicateContacts.length > 0 && (
                    <li>{duplicateContacts.reduce((sum, g) => sum + g.items.length - 1, 0)} contact(s) en doublon</li>
                  )}
                  {duplicateCompanies.length > 0 && (
                    <li>{duplicateCompanies.reduce((sum, g) => sum + g.items.length - 1, 0)} entreprise(s) en doublon</li>
                  )}
                </ul>
                <p className="mt-2 text-xs">Cette action est irréversible.</p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAutoCleanupRunning}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAutoCleanup}
              disabled={isAutoCleanupRunning}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isAutoCleanupRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Nettoyage en cours...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer les doublons
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
