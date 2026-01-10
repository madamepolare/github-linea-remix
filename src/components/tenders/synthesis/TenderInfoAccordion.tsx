import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Calendar,
  Users,
  FileText,
  ChevronDown,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  ExternalLink,
  Globe,
  Link2,
  Hash,
  Euro,
  Ruler,
  X,
  Edit2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTenders } from "@/hooks/useTenders";
import { toast } from "sonner";
import type { Tender } from "@/lib/tenderTypes";

interface TenderInfoAccordionProps {
  tender: Tender;
  onNavigateToTab: (tab: string) => void;
}

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  content: React.ReactNode;
}

export function TenderInfoAccordion({ tender, onNavigateToTab }: TenderInfoAccordionProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["moa"]);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const { updateTender } = useTenders();

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleRemoveSpecialty = (memberId: string) => {
    const requiredTeam = Array.isArray(tender.required_team) ? tender.required_team : [];
    const updatedTeam = requiredTeam.filter((m: any) => m.id !== memberId);
    
    updateTender.mutate({
      id: tender.id,
      required_team: updatedTeam,
    }, {
      onSuccess: () => {
        toast.success("Spécialité retirée");
      },
    });
  };

  const extendedTender = tender as any;

  const requiredTeam = Array.isArray(tender.required_team) ? tender.required_team : [];
  const mandatoryTeam = requiredTeam.filter((t: any) => t.is_mandatory);

  const getSpecialtyLabel = (specialty: string): string => {
    const labels: Record<string, string> = {
      architecte: "Architecte",
      architecte_associe: "Archi. associé",
      bet_structure: "BET Structure",
      bet_fluides: "BET Fluides",
      bet_electricite: "BET Électricité",
      bet_thermique: "BET Thermique",
      thermicien: "Thermicien",
      economiste: "Économiste",
      acousticien: "Acousticien",
      paysagiste: "Paysagiste",
      vrd: "VRD",
      opc: "OPC",
      ssi: "SSI",
      bim: "BIM Manager",
      hqe: "HQE / Environnement",
      urbaniste: "Urbaniste",
      scenographe: "Scénographe",
      eclairagiste: "Éclairagiste",
      signaletique: "Signalétique",
    };
    return labels[specialty] || specialty;
  };

  const sections: AccordionSection[] = [
    {
      id: "moa",
      title: "Maître d'ouvrage",
      icon: Building2,
      badge: tender.client_type,
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="font-medium">{tender.client_name || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{tender.client_type || "—"}</p>
            </div>
          </div>
          {tender.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{tender.location}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {tender.source_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3 w-3 mr-1" />
                  Source
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            {tender.dce_link && (
              <Button variant="outline" size="sm" asChild>
                <a href={tender.dce_link} target="_blank" rel="noopener noreferrer">
                  <Link2 className="h-3 w-3 mr-1" />
                  DCE
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "dates",
      title: "Dates & Échéances",
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Date limite de dépôt</p>
                <p className="font-medium">
                  {tender.submission_deadline
                    ? format(new Date(tender.submission_deadline), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                    : "Non définie"}
                </p>
              </div>
            </div>
            {tender.site_visit_date && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Visite de site</p>
                  <p className="font-medium">
                    {format(new Date(tender.site_visit_date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                  {tender.site_visit_required && (
                    <Badge variant="secondary" className="mt-1 text-xs">Obligatoire</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          {tender.site_visit_required && (extendedTender.site_visit_contact_name || extendedTender.site_visit_contact_phone) && (
            <div className="pt-2 border-t space-y-1">
              <p className="text-xs text-muted-foreground">Contact visite</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {extendedTender.site_visit_contact_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {extendedTender.site_visit_contact_name}
                  </span>
                )}
                {extendedTender.site_visit_contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {extendedTender.site_visit_contact_phone}
                  </span>
                )}
                {extendedTender.site_visit_contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {extendedTender.site_visit_contact_email}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "team",
      title: "Équipe requise",
      icon: Users,
      badge: mandatoryTeam.length > 0 ? `${mandatoryTeam.length} obligatoire${mandatoryTeam.length > 1 ? "s" : ""}` : undefined,
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {requiredTeam.length > 0 ? `${requiredTeam.length} spécialité(s)` : "Aucune équipe définie"}
            </span>
            {requiredTeam.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setIsEditingTeam(!isEditingTeam)}
              >
                <Edit2 className="h-3 w-3" />
                {isEditingTeam ? "Terminé" : "Modifier"}
              </Button>
            )}
          </div>
          
          {requiredTeam.length > 0 && (
            <div className="space-y-2">
              {requiredTeam.map((member: any, index: number) => (
                <div
                  key={member.id || index}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg group",
                    member.is_mandatory ? "bg-primary/5" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={member.is_mandatory ? "default" : "secondary"} className="text-xs">
                      {getSpecialtyLabel(member.specialty)}
                    </Badge>
                    {member.source && (
                      <span className="text-xs text-muted-foreground">
                        📄 {member.source}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.is_mandatory && !isEditingTeam && (
                      <span className="text-xs text-primary font-medium">Obligatoire</span>
                    )}
                    {isEditingTeam && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSpecialty(member.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onNavigateToTab("equipe")}
          >
            <Users className="h-4 w-4 mr-2" />
            Gérer l'équipe
          </Button>
        </div>
      ),
    },
    {
      id: "project",
      title: "Détails du projet",
      icon: FileText,
      content: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Référence</p>
                <p className="font-medium text-sm">{tender.reference || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Euro className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-medium text-sm">
                  {tender.estimated_budget
                    ? `${(tender.estimated_budget / 1000000).toFixed(1).replace(".0", "")} M€ HT`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Surface</p>
                <p className="font-medium text-sm">
                  {tender.surface_area ? `${tender.surface_area.toLocaleString()} m²` : "—"}
                </p>
              </div>
            </div>
          </div>
          {tender.description && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm line-clamp-4">{tender.description}</p>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <Card>
        <CardContent className="p-0 divide-y">
          {sections.map((section, index) => (
            <div key={section.id}>
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <section.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{section.title}</span>
                  {section.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.includes(section.id) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSections.includes(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-14">{section.content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
