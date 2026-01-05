import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Calendar,
  PenTool,
  Eye,
  ArrowRight
} from "lucide-react";
import { useAgencyDocuments } from "@/hooks/useAgencyDocuments";
import { useDocumentReminders, type ExpiringDocument } from "@/hooks/useDocumentReminders";
import { useDocumentSignatures } from "@/hooks/useDocumentSignatures";
import { useDocumentApproval } from "@/hooks/useDocumentWorkflow";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/documentTypes";
import { format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function DocumentsDashboard() {
  const navigate = useNavigate();
  const { documents, stats, isLoading } = useAgencyDocuments();
  const { expiringDocuments, expiredCount, criticalCount, warningCount } = useDocumentReminders();
  const { pendingSignatures } = useDocumentSignatures();
  const { pendingApprovals } = useDocumentApproval();

  // Calculate stats by status
  const statusCounts = documents.reduce((acc, doc) => {
    const status = doc.status || 'draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: DOCUMENT_STATUS_LABELS[status as keyof typeof DOCUMENT_STATUS_LABELS] || status,
    value: count,
  }));

  // Calculate stats by category
  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category === 'administrative' ? 'Admin.' : 
          category === 'project' ? 'Projet' : 
          category === 'hr' ? 'RH' : category,
    count,
  }));

  const getUrgencyStyles = (urgency: ExpiringDocument['urgency']) => {
    switch (urgency) {
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'critical':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getUrgencyLabel = (doc: ExpiringDocument) => {
    if (doc.urgency === 'expired') return 'Expiré';
    if (doc.days_until_expiry === 0) return "Expire aujourd'hui";
    if (doc.days_until_expiry === 1) return 'Expire demain';
    return `Expire dans ${doc.days_until_expiry} jours`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(expiredCount > 0 || criticalCount > 0 || pendingApprovals.length > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          {expiredCount > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  Documents expirés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{expiredCount}</div>
                <p className="text-xs text-muted-foreground">
                  Nécessitent une action immédiate
                </p>
              </CardContent>
            </Card>
          )}
          
          {criticalCount > 0 && (
            <Card className="border-orange-500/50 bg-orange-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Expirent sous 7 jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
                <p className="text-xs text-muted-foreground">
                  À renouveler rapidement
                </p>
              </CardContent>
            </Card>
          )}

          {pendingApprovals.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                  <Clock className="h-4 w-4" />
                  En attente d'approbation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{pendingApprovals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Documents à valider
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tous les documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Créés ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSignatures.length}</div>
            <p className="text-xs text-muted-foreground">
              Signatures en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts['draft'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              À finaliser
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Aucune donnée
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {statusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Documents à renouveler</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {expiringDocuments.length > 0 ? (
                <div className="space-y-2">
                  {expiringDocuments.slice(0, 10).map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-2 rounded-lg border text-sm cursor-pointer hover:opacity-80 transition-opacity ${getUrgencyStyles(doc.urgency)}`}
                      onClick={() => navigate(`/documents?id=${doc.id}`)}
                    >
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs flex items-center justify-between mt-1">
                        <span>{DOCUMENT_TYPE_LABELS[doc.document_type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.document_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {getUrgencyLabel(doc)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                  <span>Aucun document à renouveler</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Pending Signatures & Approvals */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Signatures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Signatures en attente
            </CardTitle>
            {pendingSignatures.length > 0 && (
              <Badge variant="secondary">{pendingSignatures.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {pendingSignatures.length > 0 ? (
                <div className="space-y-2">
                  {pendingSignatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/documents?id=${sig.document_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {sig.document?.title || 'Document'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{sig.signers?.length || 0} signataire(s)</span>
                        <span>•</span>
                        <span>
                          {sig.signers?.filter(s => s.status === 'signed').length || 0} signé(s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                  <span>Aucune signature en attente</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Approbations en attente
            </CardTitle>
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary">{pendingApprovals.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {pendingApprovals.length > 0 ? (
                <div className="space-y-2">
                  {pendingApprovals.map((approval: any) => (
                    <div
                      key={approval.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/documents?id=${approval.instance?.document_id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {approval.instance?.document?.title || 'Document'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Étape: {approval.step?.name || 'Validation'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                  <span>Aucune approbation en attente</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
