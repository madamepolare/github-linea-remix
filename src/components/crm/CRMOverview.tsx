import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, Users, Target, Euro, ArrowRight, Search, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { CRMCompanyEnriched, Contact } from "@/lib/crmTypes";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { cn } from "@/lib/utils";


interface CRMOverviewProps {
  onNavigate: (view: string) => void;
  companiesCount: number;
  contactsCount: number;
  leadStats: {
    total: number;
    totalValue: number;
    weightedValue: number;
    wonValue: number;
    lostCount: number;
  };
  companies: CRMCompanyEnriched[];
  contacts: Contact[];
}

export function CRMOverview({
  onNavigate,
  companiesCount,
  contactsCount,
  leadStats,
  companies,
  contacts,
}: CRMOverviewProps) {
  const navigate = useNavigate();
  const { getCompanyTypeLabel, getCompanyTypeShortLabel, getCompanyTypeColor, getContactTypeLabel, getContactTypeColor } = useCRMSettings();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  };

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [companies]);

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [contacts]);

  const stats = [
    {
      title: "Entreprises",
      value: companiesCount,
      icon: Building2,
      bgColor: "bg-muted/50",
      action: () => onNavigate("companies"),
    },
    {
      title: "Contacts",
      value: contactsCount,
      icon: Users,
      bgColor: "bg-muted/50",
      action: () => onNavigate("contacts"),
    },
    {
      title: "Opportunités",
      value: leadStats.total,
      icon: Target,
      bgColor: "bg-muted/50",
      action: () => onNavigate("leads"),
    },
    {
      title: "Pipeline",
      value: formatCurrency(leadStats.weightedValue),
      icon: Euro,
      bgColor: "bg-muted/50",
      action: () => onNavigate("leads"),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={stat.action}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-lg", stat.bgColor)}>
                    <stat.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent companies */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Entreprises récentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("companies")}>
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead>Société</TableHead>
                  <TableHead>Interlocuteur</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucune entreprise
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCompanies.map((company) => {
                    const typeColor = getCompanyTypeColor(company.industry || "");
                    const typeShort = getCompanyTypeShortLabel(company.industry || "");
                    const typeFull = getCompanyTypeLabel(company.industry || "");
                    return (
                      <TableRow
                        key={company.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/crm/companies/${company.id}`)}
                      >
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="text-white text-xs font-mono cursor-help"
                                style={{ backgroundColor: typeColor }}
                              >
                                {typeShort}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{typeFull}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium">
                              {company.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              {company.email && (
                                <p className="text-xs text-muted-foreground">{company.email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground italic">
                          {company.primary_contact?.name || "Aucun contact"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {company.city || "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            •••
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent contacts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Contacts récents</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("contacts")}>
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un contact..." className="pl-9" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Aucun contact
                    </TableCell>
                  </TableRow>
                ) : (
                  recentContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={contact.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {contact.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            {contact.role && (
                              <p className="text-xs text-muted-foreground">{contact.role}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.company ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{contact.company.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {contact.email && <Mail className="h-4 w-4" />}
                          {contact.phone && <Phone className="h-4 w-4" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.contact_type && (
                          <Badge variant="outline" className="gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getContactTypeColor(contact.contact_type) }}
                            />
                            {getContactTypeLabel(contact.contact_type)}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
