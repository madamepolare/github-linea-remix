import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Plus, RefreshCw, Trash2, Link2, ExternalLink, Users, User, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useCalendarConnections, CalendarProvider, CreateConnectionInput } from "@/hooks/useCalendarConnections";
import { useWorkspaceCalendars, CreateCalendarInput } from "@/hooks/useWorkspaceCalendars";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const PROVIDER_INFO: Record<CalendarProvider, { name: string; icon: string; color: string; description: string }> = {
  google: {
    name: "Google Calendar",
    icon: "🔵",
    color: "#4285F4",
    description: "Synchronisez avec votre compte Google",
  },
  outlook: {
    name: "Outlook",
    icon: "🔷",
    color: "#0078D4",
    description: "Synchronisez avec Microsoft Outlook",
  },
  apple: {
    name: "Apple Calendar",
    icon: "🍎",
    color: "#FF3B30",
    description: "Synchronisez avec iCloud Calendar",
  },
  ical: {
    name: "iCal / URL",
    icon: "📅",
    color: "#6B7280",
    description: "Importez depuis une URL iCal",
  },
};

const CALENDAR_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

export function CalendarIntegrationsSettings() {
  const { user } = useAuth();
  const { 
    personalConnections, 
    sharedConnections,
    isLoading: connectionsLoading,
    createConnection,
    deleteConnection,
    syncConnection,
    updateConnection,
  } = useCalendarConnections();
  
  const {
    calendars,
    isLoading: calendarsLoading,
    createCalendar,
    deleteCalendar,
    updateCalendar,
  } = useWorkspaceCalendars();

  const [addConnectionOpen, setAddConnectionOpen] = useState(false);
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [connectionForm, setConnectionForm] = useState<Partial<CreateConnectionInput>>({});
  const [calendarForm, setCalendarForm] = useState<Partial<CreateCalendarInput>>({});

  const handleAddConnection = async () => {
    if (!selectedProvider) return;
    
    await createConnection.mutateAsync({
      provider: selectedProvider,
      calendar_name: connectionForm.calendar_name || PROVIDER_INFO[selectedProvider].name,
      calendar_color: connectionForm.calendar_color,
      is_shared: connectionForm.is_shared,
      sync_direction: connectionForm.sync_direction || "import",
      ical_url: connectionForm.ical_url,
    });
    
    setAddConnectionOpen(false);
    setSelectedProvider(null);
    setConnectionForm({});
  };

  const handleAddCalendar = async () => {
    if (!calendarForm.name) return;
    
    await createCalendar.mutateAsync({
      name: calendarForm.name,
      description: calendarForm.description,
      color: calendarForm.color || "#10B981",
      visibility: calendarForm.visibility || "all",
    });
    
    setAddCalendarOpen(false);
    setCalendarForm({});
  };

  const getSyncStatusBadge = (status: string, lastSync: string | null) => {
    switch (status) {
      case "synced":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Synchronisé
          </Badge>
        );
      case "syncing":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Synchronisation...
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Intégrations Calendrier</h3>
        <p className="text-sm text-muted-foreground">
          Connectez vos calendriers externes et gérez les calendriers partagés de l'agence.
        </p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mes calendriers</span>
            <span className="sm:hidden">Perso</span>
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Calendriers partagés</span>
            <span className="sm:hidden">Partagés</span>
          </TabsTrigger>
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendriers agence</span>
            <span className="sm:hidden">Agence</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Calendars */}
        <TabsContent value="personal" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Vos calendriers personnels synchronisés avec l'agence.
            </p>
            <Dialog open={addConnectionOpen && !connectionForm.is_shared} onOpenChange={(open) => {
              setAddConnectionOpen(open);
              if (open) setConnectionForm({ is_shared: false });
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Connecter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Connecter un calendrier</DialogTitle>
                  <DialogDescription>
                    Choisissez le service à synchroniser
                  </DialogDescription>
                </DialogHeader>
                
                {!selectedProvider ? (
                  <div className="grid grid-cols-2 gap-3 py-4">
                    {(Object.keys(PROVIDER_INFO) as CalendarProvider[]).map((provider) => (
                      <button
                        key={provider}
                        onClick={() => setSelectedProvider(provider)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors"
                      >
                        <span className="text-2xl">{PROVIDER_INFO[provider].icon}</span>
                        <span className="text-sm font-medium">{PROVIDER_INFO[provider].name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <span className="text-2xl">{PROVIDER_INFO[selectedProvider].icon}</span>
                      <div>
                        <p className="font-medium">{PROVIDER_INFO[selectedProvider].name}</p>
                        <p className="text-sm text-muted-foreground">{PROVIDER_INFO[selectedProvider].description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nom du calendrier</Label>
                        <Input
                          placeholder="Mon calendrier"
                          value={connectionForm.calendar_name || ""}
                          onChange={(e) => setConnectionForm({ ...connectionForm, calendar_name: e.target.value })}
                        />
                      </div>

                      {selectedProvider === "ical" && (
                        <div className="space-y-2">
                          <Label>URL iCal</Label>
                          <Input
                            placeholder="https://..."
                            value={connectionForm.ical_url || ""}
                            onChange={(e) => setConnectionForm({ ...connectionForm, ical_url: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Couleur</Label>
                        <div className="flex gap-2 flex-wrap">
                          {CALENDAR_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setConnectionForm({ ...connectionForm, calendar_color: color })}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform",
                                connectionForm.calendar_color === color ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {selectedProvider && (
                    <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                      Retour
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddConnection} 
                    disabled={!selectedProvider || createConnection.isPending}
                  >
                    {createConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Connecter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {connectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : personalConnections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-1">Aucun calendrier connecté</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Synchronisez vos calendriers pour voir tous vos événements au même endroit.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {personalConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                          style={{ backgroundColor: connection.calendar_color || PROVIDER_INFO[connection.provider].color }}
                        >
                          {PROVIDER_INFO[connection.provider].icon}
                        </div>
                        <div>
                          <p className="font-medium">{connection.calendar_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {connection.provider_account_email || PROVIDER_INFO[connection.provider].name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSyncStatusBadge(connection.sync_status, connection.last_sync_at)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => syncConnection.mutate(connection.id)}
                          disabled={syncConnection.isPending}
                        >
                          <RefreshCw className={cn("h-4 w-4", syncConnection.isPending && "animate-spin")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteConnection.mutate(connection.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {connection.last_sync_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Dernière sync: {format(new Date(connection.last_sync_at), "Pp", { locale: fr })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shared External Calendars */}
        <TabsContent value="shared" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Calendriers externes partagés avec toute l'agence.
            </p>
            <Dialog open={addConnectionOpen && connectionForm.is_shared} onOpenChange={(open) => {
              setAddConnectionOpen(open);
              if (open) setConnectionForm({ is_shared: true });
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un calendrier partagé</DialogTitle>
                  <DialogDescription>
                    Ce calendrier sera visible par tous les membres
                  </DialogDescription>
                </DialogHeader>
                
                {!selectedProvider ? (
                  <div className="grid grid-cols-2 gap-3 py-4">
                    {(Object.keys(PROVIDER_INFO) as CalendarProvider[]).map((provider) => (
                      <button
                        key={provider}
                        onClick={() => setSelectedProvider(provider)}
                        className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors"
                      >
                        <span className="text-2xl">{PROVIDER_INFO[provider].icon}</span>
                        <span className="text-sm font-medium">{PROVIDER_INFO[provider].name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <span className="text-2xl">{PROVIDER_INFO[selectedProvider].icon}</span>
                      <div>
                        <p className="font-medium">{PROVIDER_INFO[selectedProvider].name}</p>
                        <p className="text-sm text-muted-foreground">{PROVIDER_INFO[selectedProvider].description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nom du calendrier</Label>
                        <Input
                          placeholder="Calendrier équipe"
                          value={connectionForm.calendar_name || ""}
                          onChange={(e) => setConnectionForm({ ...connectionForm, calendar_name: e.target.value })}
                        />
                      </div>

                      {selectedProvider === "ical" && (
                        <div className="space-y-2">
                          <Label>URL iCal</Label>
                          <Input
                            placeholder="https://..."
                            value={connectionForm.ical_url || ""}
                            onChange={(e) => setConnectionForm({ ...connectionForm, ical_url: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Couleur</Label>
                        <div className="flex gap-2 flex-wrap">
                          {CALENDAR_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setConnectionForm({ ...connectionForm, calendar_color: color })}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-transform",
                                connectionForm.calendar_color === color ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {selectedProvider && (
                    <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                      Retour
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddConnection} 
                    disabled={!selectedProvider || createConnection.isPending}
                  >
                    {createConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {connectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sharedConnections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-1">Aucun calendrier partagé</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez des calendriers externes visibles par toute l'équipe.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sharedConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                          style={{ backgroundColor: connection.calendar_color || PROVIDER_INFO[connection.provider].color }}
                        >
                          {PROVIDER_INFO[connection.provider].icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{connection.calendar_name}</p>
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Partagé
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {connection.provider_account_email || PROVIDER_INFO[connection.provider].name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSyncStatusBadge(connection.sync_status, connection.last_sync_at)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => syncConnection.mutate(connection.id)}
                          disabled={syncConnection.isPending}
                        >
                          <RefreshCw className={cn("h-4 w-4", syncConnection.isPending && "animate-spin")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteConnection.mutate(connection.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Internal Workspace Calendars */}
        <TabsContent value="workspace" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Calendriers internes de l'agence (jours fériés, événements d'équipe, etc.).
            </p>
            <Dialog open={addCalendarOpen} onOpenChange={setAddCalendarOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Créer un calendrier</DialogTitle>
                  <DialogDescription>
                    Créez un calendrier interne pour l'agence
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nom du calendrier</Label>
                    <Input
                      placeholder="Jours fériés, Événements équipe..."
                      value={calendarForm.name || ""}
                      onChange={(e) => setCalendarForm({ ...calendarForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optionnel)</Label>
                    <Input
                      placeholder="Description du calendrier..."
                      value={calendarForm.description || ""}
                      onChange={(e) => setCalendarForm({ ...calendarForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <div className="flex gap-2 flex-wrap">
                      {CALENDAR_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setCalendarForm({ ...calendarForm, color })}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform",
                            calendarForm.color === color ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Visibilité</Label>
                    <Select
                      value={calendarForm.visibility || "all"}
                      onValueChange={(value: "all" | "members" | "admins") => 
                        setCalendarForm({ ...calendarForm, visibility: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les membres</SelectItem>
                        <SelectItem value="members">Membres uniquement</SelectItem>
                        <SelectItem value="admins">Administrateurs uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    onClick={handleAddCalendar} 
                    disabled={!calendarForm.name || createCalendar.isPending}
                  >
                    {createCalendar.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {calendarsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calendars.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-1">Aucun calendrier d'agence</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez des calendriers pour les jours fériés, événements d'équipe, etc.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {calendars.map((calendar) => (
                <Card key={calendar.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: calendar.color + "20" }}
                        >
                          <Calendar className="h-5 w-5" style={{ color: calendar.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{calendar.name}</p>
                            {calendar.is_default && (
                              <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                            )}
                          </div>
                          {calendar.description && (
                            <p className="text-sm text-muted-foreground">{calendar.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {calendar.visibility === "all" ? "Tous" : 
                           calendar.visibility === "members" ? "Membres" : "Admins"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCalendar.mutate(calendar.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
