import { useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Globe,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useCRMCompanies, CRMCompany } from "@/hooks/useCRMCompanies";

const industryLabels: Record<string, string> = {
  maitre_ouvrage: "Maître d'ouvrage",
  bet: "BET",
  entreprise: "Entreprise",
  fournisseur: "Fournisseur",
  partenaire: "Partenaire",
};

const industryColors: Record<string, string> = {
  maitre_ouvrage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  bet: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  entreprise: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  fournisseur: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  partenaire: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

interface CRMCompanyTableProps {
  onCreateCompany: () => void;
}

export function CRMCompanyTable({ onCreateCompany }: CRMCompanyTableProps) {
  const { companies, isLoading, deleteCompany } = useCRMCompanies();
  const [search, setSearch] = useState("");

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={onCreateCompany} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle
          </Button>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune entreprise trouvée</p>
            <Button variant="outline" className="mt-4" onClick={onCreateCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une entreprise
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company, index) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                          {company.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          {company.bet_specialties && company.bet_specialties.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {company.bet_specialties.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.industry && (
                        <Badge className={industryColors[company.industry] || ""}>
                          {industryLabels[company.industry] || company.industry}
                        </Badge>
                      )}
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
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            Voir contacts
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
