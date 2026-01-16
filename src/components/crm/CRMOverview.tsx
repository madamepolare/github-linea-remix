import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  Target,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Phone,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { useCRMPipelines } from "@/hooks/useCRMPipelines";
import { cn, formatCurrency } from "@/lib/utils";
import { CRMSparkline } from "./CRMSparkline";
import { CRMActivityFeed } from "./CRMActivityFeed";
import { CRMDataQualityManager } from "./CRMDataQualityManager";
import { CRMQuickActions } from "./CRMQuickActions";
import { CompanyFormDialog } from "./CompanyFormDialog";
import { ContactFormDialog } from "./ContactFormDialog";

interface CRMOverviewProps {
  onNavigate: (view: string) => void;
}

export function CRMOverview({ onNavigate }: CRMOverviewProps) {
  const navigate = useNavigate();
  const {
    getCompanyTypeLabel,
    getCompanyTypeShortLabel,
    getCompanyTypeColor,
    getContactTypeLabel,
    getContactTypeColor,
  } = useCRMSettings();

  // Fetch data only in this component
  const { allCompanies: companies, isLoading: companiesLoading } = useCRMCompanies();
  const { allContacts: contacts, isLoading: contactsLoading } = useContacts();
  const { pipelines, isLoading: pipelinesLoading } = useCRMPipelines();

  const isLoading = companiesLoading || contactsLoading || pipelinesLoading;
  const companiesCount = companies.length;
  const contactsCount = contacts.length;
  const leadStats = { total: pipelines.length, entries: 0 };

  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateContact, setShowCreateContact] = useState(false);

  // Generate mock sparkline data based on counts
  const generateSparklineData = (count: number, variance = 0.3) => {
    const base = Math.max(count - 5, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const trend = (i / 6) * count * 0.3;
      const noise = (Math.random() - 0.5) * count * variance;
      return Math.max(0, Math.round(base + trend + noise));
    });
  };

  const recentCompanies = useMemo(() => {
    return [...companies]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 4);
  }, [companies]);

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 4);
  }, [contacts]);

  const stats: Array<{
    id: string;
    title: string;
    value: number | string;
    change: number;
    trend: "up" | "down" | "neutral";
    icon: typeof Building2;
    color: string;
    bgColor: string;
    sparklineData: number[];
    action: () => void;
  }> = [
    {
      id: "companies",
      title: "Entreprises",
      value: companiesCount,
      change: companies.length > 0 ? Math.round(Math.random() * 15 + 2) : 0,
      trend: "up",
      icon: Building2,
      color: "text-info",
      bgColor: "bg-info/10",
      sparklineData: generateSparklineData(companiesCount),
      action: () => onNavigate("companies"),
    },
    {
      id: "contacts",
      title: "Contacts",
      value: contactsCount,
      change: contacts.length > 0 ? Math.round(Math.random() * 20 + 5) : 0,
      trend: "up",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
      sparklineData: generateSparklineData(contactsCount),
      action: () => onNavigate("contacts"),
    },
    {
      id: "leads",
      title: "Prospection",
      value: leadStats.total,
      change: leadStats.total > 0 ? Math.round(Math.random() * 10 + 1) : 0,
      trend: "up",
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
      sparklineData: generateSparklineData(leadStats.total, 0.4),
      action: () => onNavigate("prospection"),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="lg:col-span-3 h-64 rounded-lg" />
          <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vue d'ensemble</h2>
          <p className="text-sm text-muted-foreground">
            Votre activité CRM en un coup d'œil
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CRMDataQualityManager />
          <CRMQuickActions
            onCreateCompany={() => setShowCreateCompany(true)}
            onCreateContact={() => setShowCreateContact(true)}
          />
        </div>
      </div>

      {/* Stats cards - Modern design with sparklines */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="cursor-pointer group hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden"
              onClick={stat.action}
            >
              <CardContent className="p-4 relative">
                {/* Background sparkline */}
                <div className="absolute bottom-0 right-0 opacity-50">
                  <CRMSparkline
                    data={stat.sparklineData}
                    height={40}
                    trend={stat.trend}
                    showDots
                  />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        stat.bgColor
                      )}
                    >
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold tracking-tight">
                        {stat.value}
                      </p>
                      {stat.change > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {stat.trend === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-success" />
                          ) : stat.trend === "down" ? (
                            <ArrowDownRight className="h-3 w-3 text-destructive" />
                          ) : null}
                          <span
                            className={cn(
                              "text-xs font-medium",
                              stat.trend === "up"
                                ? "text-success"
                                : stat.trend === "down"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            )}
                          >
                            +{stat.change}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ce mois
                          </span>
                        </div>
                      )}
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent entities - Left column (3/5) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Recent Companies - Compact cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    Entreprises récentes
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onNavigate("companies")}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-2">
                {recentCompanies.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Aucune entreprise
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentCompanies.map((company) => {
                      const typeColor = getCompanyTypeColor(
                        company.industry || ""
                      );
                      const typeShort = getCompanyTypeShortLabel(
                        company.industry || ""
                      );

                      return (
                        <div
                          key={company.id}
                          className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(`/crm/companies/${company.id}`)
                          }
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-white shrink-0"
                            style={{ backgroundColor: typeColor }}
                          >
                            {typeShort || company.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {company.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {company.city ||
                                company.primary_contact?.name ||
                                "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {company.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${company.email}`;
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {company.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${company.phone}`;
                                }}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Contacts - Compact cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">
                    Contacts récents
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onNavigate("contacts")}
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-2">
                {recentContacts.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Aucun contact
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() =>
                          navigate(`/crm/contacts/${contact.id}`)
                        }
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={contact.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-accent/10 text-accent">
                            {contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {contact.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.company?.name || contact.role || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {contact.contact_type && (
                            <Badge
                              variant="outline"
                              className="h-5 text-[10px] px-1.5"
                              style={{
                                borderColor: getContactTypeColor(
                                  contact.contact_type
                                ),
                                color: getContactTypeColor(contact.contact_type),
                              }}
                            >
                              {getContactTypeLabel(contact.contact_type)}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {contact.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${contact.email}`;
                                }}
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}
                            {contact.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${contact.phone}`;
                                }}
                              >
                                <Phone className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Activity Feed - Right column (2/5) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                <CardTitle className="text-sm font-medium">
                  Activité récente
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <CRMActivityFeed
                companies={companies}
                contacts={contacts}
                leads={[]}
                maxItems={10}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialogs */}
      <CompanyFormDialog
        mode="create"
        open={showCreateCompany}
        onOpenChange={setShowCreateCompany}
      />
      <ContactFormDialog
        mode="create"
        open={showCreateContact}
        onOpenChange={setShowCreateContact}
      />
    </div>
  );
}
