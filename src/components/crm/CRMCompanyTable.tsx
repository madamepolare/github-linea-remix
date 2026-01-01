import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Users,
  Building2,
  Target,
  ExternalLink,
} from "lucide-react";
import { useCRMCompanies, CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { CompanyCategory, getCompanyTypeConfig } from "@/lib/crmTypes";
import { InlineEditCell } from "./InlineEditCell";
import { cn } from "@/lib/utils";

export interface CRMCompanyTableProps {
  category?: CompanyCategory;
  search?: string;
  onCreateCompany: () => void;
}

export function CRMCompanyTable({ category = "all", search = "", onCreateCompany }: CRMCompanyTableProps) {
  const navigate = useNavigate();
  const { companies, isLoading, deleteCompany, updateCompany } = useCRMCompanies({ category, search });
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const filteredCompanies = useMemo(() => {
    let result = companies;
    
    if (letterFilter) {
      result = result.filter((c) => c.name.toUpperCase().startsWith(letterFilter));
    }
    
    return result;
  }, [companies, letterFilter]);

  if (isLoading) {
    return (
      <Card className="m-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card className="m-6">
        <CardContent className="p-6">
          <EmptyState
            icon={Building2}
            title="Aucune entreprise"
            description="Ajoutez votre première entreprise pour commencer à gérer vos relations."
            action={{ label: "Créer une entreprise", onClick: onCreateCompany }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="p-6 space-y-4">
        {/* Alphabet filter */}
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant={letterFilter === null ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setLetterFilter(null)}
          >
            Tous
          </Button>
          {alphabet.map((letter) => {
            const hasCompanies = companies.some((c) => c.name.toUpperCase().startsWith(letter));
            return (
              <Button
                key={letter}
                variant={letterFilter === letter ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 w-7 p-0 text-xs",
                  !hasCompanies && "opacity-30"
                )}
                onClick={() => setLetterFilter(letterFilter === letter ? null : letter)}
                disabled={!hasCompanies}
              >
                {letter}
              </Button>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Entreprise</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead className="text-center">Contacts</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company, index) => {
                    const typeConfig = getCompanyTypeConfig(company.industry);
                    return (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/crm/companies/${company.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                              {company.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <InlineEditCell
                                value={company.name}
                                onSave={(value) => updateCompany.mutate({ id: company.id, name: value })}
                              />
                              {company.primary_contact && (
                                <p className="text-xs text-muted-foreground">
                                  {company.primary_contact.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", typeConfig.color)} />
                            {typeConfig.shortLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {company.city ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {company.city}
                                {company.postal_code && ` (${company.postal_code})`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{company.contacts_count}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{company.leads_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {company.email && (
                              <a
                                href={`mailto:${company.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-foreground"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {company.phone && (
                              <a
                                href={`tel:${company.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-foreground"
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-foreground"
                              >
                                <Globe className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/crm/companies/${company.id}`)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCompany.mutate(company.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
