import { useState } from "react";
import { useTeams, Team } from "@/hooks/useTeams";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Pencil, Trash2, UsersRound, X, Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEAM_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

export function TeamManagementDialog({ open, onOpenChange }: TeamManagementDialogProps) {
  const { teams, createTeam, updateTeam, deleteTeam, setTeamMembers } = useTeams();
  const { data: members } = useTeamMembers();
  
  const [activeTab, setActiveTab] = useState("list");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setNewTeamName("");
    setNewTeamDescription("");
    setNewTeamColor(TEAM_COLORS[0]);
    setSelectedMembers(new Set());
    setEditingTeam(null);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    const result = await createTeam.mutateAsync({
      name: newTeamName,
      description: newTeamDescription || undefined,
      color: newTeamColor,
    });

    if (result && selectedMembers.size > 0) {
      await setTeamMembers.mutateAsync({
        teamId: result.id,
        userIds: Array.from(selectedMembers),
      });
    }

    resetForm();
    setActiveTab("list");
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) return;

    await updateTeam.mutateAsync({
      id: editingTeam.id,
      name: newTeamName,
      description: newTeamDescription || null,
      color: newTeamColor,
    });

    await setTeamMembers.mutateAsync({
      teamId: editingTeam.id,
      userIds: Array.from(selectedMembers),
    });

    resetForm();
    setActiveTab("list");
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setNewTeamName(team.name);
    setNewTeamDescription(team.description || "");
    setNewTeamColor(team.color);
    setSelectedMembers(new Set(team.members?.map(m => m.user_id) || []));
    setActiveTab("edit");
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm("Supprimer cette équipe ?")) {
      await deleteTeam.mutateAsync(teamId);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetForm();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Gestion des équipes
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Équipes ({teams.length})</TabsTrigger>
            <TabsTrigger value={editingTeam ? "edit" : "create"}>
              {editingTeam ? "Modifier" : "Créer"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[400px]">
              {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <UsersRound className="h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune équipe créée</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab("create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une équipe
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {teams.map(team => (
                    <Card key={team.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: team.color + "20", color: team.color }}
                            >
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{team.name}</h4>
                              {team.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {team.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {team.members?.length || 0} membre{(team.members?.length || 0) > 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditTeam(team)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Team members preview */}
                        {team.members && team.members.length > 0 && (
                          <div className="flex items-center gap-1 mt-3">
                            {team.members.slice(0, 5).map(tm => {
                              const member = members?.find(m => m.user_id === tm.user_id);
                              return (
                                <Avatar key={tm.user_id} className="h-7 w-7 border-2 border-background">
                                  <AvatarImage src={member?.profile?.avatar_url || ""} />
                                  <AvatarFallback className="text-[10px]">
                                    {(member?.profile?.full_name || "?").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
                            {team.members.length > 5 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                +{team.members.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-hidden mt-4">
            <TeamForm
              name={newTeamName}
              setName={setNewTeamName}
              description={newTeamDescription}
              setDescription={setNewTeamDescription}
              color={newTeamColor}
              setColor={setNewTeamColor}
              selectedMembers={selectedMembers}
              toggleMember={toggleMember}
              members={members || []}
            />
          </TabsContent>

          <TabsContent value="edit" className="flex-1 overflow-hidden mt-4">
            <TeamForm
              name={newTeamName}
              setName={setNewTeamName}
              description={newTeamDescription}
              setDescription={setNewTeamDescription}
              color={newTeamColor}
              setColor={setNewTeamColor}
              selectedMembers={selectedMembers}
              toggleMember={toggleMember}
              members={members || []}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "list" ? (
            <Button onClick={() => setActiveTab("create")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle équipe
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                resetForm();
                setActiveTab("list");
              }}>
                Annuler
              </Button>
              <Button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                disabled={!newTeamName.trim() || createTeam.isPending || updateTeam.isPending}
              >
                {editingTeam ? "Enregistrer" : "Créer l'équipe"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TeamFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  selectedMembers: Set<string>;
  toggleMember: (userId: string) => void;
  members: { user_id: string; profile?: { full_name: string | null; avatar_url: string | null } | null }[];
}

function TeamForm({
  name,
  setName,
  description,
  setDescription,
  color,
  setColor,
  selectedMembers,
  toggleMember,
  members,
}: TeamFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-2">
          <Label>Nom de l'équipe</Label>
          <Input
            placeholder="Ex: Design, Développement..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Couleur</Label>
          <div className="flex gap-2">
            {TEAM_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (optionnel)</Label>
        <Textarea
          placeholder="Description de l'équipe..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Membres ({selectedMembers.size} sélectionnés)</Label>
        <ScrollArea className="h-[180px] border rounded-lg p-2">
          <div className="space-y-1">
            {members.map(member => (
              <div
                key={member.user_id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedMembers.has(member.user_id)
                    ? "bg-primary/10"
                    : "hover:bg-muted"
                )}
                onClick={() => toggleMember(member.user_id)}
              >
                <Checkbox
                  checked={selectedMembers.has(member.user_id)}
                  onCheckedChange={() => toggleMember(member.user_id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profile?.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {(member.profile?.full_name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.profile?.full_name || "Sans nom"}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
