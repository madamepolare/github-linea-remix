import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Building,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  UserCircle,
} from "lucide-react";
import { useCompanyDepartments, CompanyDepartment, CreateDepartmentInput } from "@/hooks/useCompanyDepartments";
import { useContacts, Contact } from "@/hooks/useContacts";
import { CountryFlag } from "@/components/ui/country-flag";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CompanyDepartmentsSectionProps {
  companyId: string;
  companyContacts: Contact[];
}

export function CompanyDepartmentsSection({ companyId, companyContacts }: CompanyDepartmentsSectionProps) {
  const { departments, isLoading, createDepartment, updateDepartment, deleteDepartment } = useCompanyDepartments(companyId);
  const { updateContact } = useContacts();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<CompanyDepartment | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentInput>({
    company_id: companyId,
    name: "",
    description: "",
    location: "",
  });

  const handleOpenCreate = () => {
    setEditingDepartment(null);
    setFormData({
      company_id: companyId,
      name: "",
      description: "",
      location: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (dept: CompanyDepartment) => {
    setEditingDepartment(dept);
    setFormData({
      company_id: companyId,
      name: dept.name,
      description: dept.description || "",
      location: dept.location || "",
      manager_contact_id: dept.manager_contact_id || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    
    if (editingDepartment) {
      updateDepartment.mutate({
        id: editingDepartment.id,
        name: formData.name,
        description: formData.description || null,
        location: formData.location || null,
        manager_contact_id: formData.manager_contact_id || null,
      });
    } else {
      createDepartment.mutate(formData);
    }
    setDialogOpen(false);
  };

  const handleAssignContact = (contactId: string, departmentId: string | null) => {
    updateContact.mutate({ id: contactId, department_id: departmentId });
  };

  const getContactsForDepartment = (deptId: string) => {
    return companyContacts.filter(c => c.department_id === deptId);
  };

  const unassignedContacts = companyContacts.filter(c => !c.department_id);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            Départements / Directions
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun département</p>
              <p className="text-xs mt-1">Créez des départements pour organiser vos contacts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => {
                const deptContacts = getContactsForDepartment(dept.id);
                const manager = deptContacts.find(c => c.id === dept.manager_contact_id);
                
                return (
                  <div
                    key={dept.id}
                    className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{dept.name}</h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {deptContacts.length} contact{deptContacts.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        {dept.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {dept.location && (
                            <span className="flex items-center gap-1">
                              <CountryFlag location={dept.location} size="xs" />
                              <MapPin className="h-3 w-3" />
                              {dept.location}
                            </span>
                          )}
                          {manager && (
                            <span className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              {manager.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEdit(dept)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteDepartment.mutate(dept.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Contacts in department */}
                    {deptContacts.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-2">
                          {deptContacts.map((contact) => (
                            <Link
                              key={contact.id}
                              to={`/crm/contacts/${contact.id}`}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={contact.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {contact.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{contact.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned contacts */}
              {unassignedContacts.length > 0 && (
                <div className="border border-dashed rounded-lg p-3 bg-muted/20">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium">Non assignés ({unassignedContacts.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {unassignedContacts.slice(0, 6).map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background border"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={contact.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {contact.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{contact.name}</span>
                        <Select
                          value=""
                          onValueChange={(val) => handleAssignContact(contact.id, val)}
                        >
                          <SelectTrigger className="h-5 w-5 p-0 border-0 bg-transparent [&>svg]:hidden">
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    {unassignedContacts.length > 6 && (
                      <span className="text-xs text-muted-foreground px-2 py-1">
                        +{unassignedContacts.length - 6} autres
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Modifier le département" : "Nouveau département"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nom *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Direction territoriale Sud-Ouest"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du département..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Localisation</label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Bordeaux, France"
              />
            </div>
            {editingDepartment && companyContacts.length > 0 && (
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <Select
                  value={formData.manager_contact_id || "_none"}
                  onValueChange={(val) => setFormData({ 
                    ...formData, 
                    manager_contact_id: val === "_none" ? undefined : val 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun</SelectItem>
                    {companyContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim() || createDepartment.isPending || updateDepartment.isPending}
            >
              {editingDepartment ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
