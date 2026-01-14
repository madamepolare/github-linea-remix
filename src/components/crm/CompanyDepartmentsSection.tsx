import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Building,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  UserCircle,
  GripVertical,
  Receipt,
  Mail,
  Phone,
  Crown,
  Briefcase,
  CreditCard,
} from "lucide-react";
import { useCompanyDepartments, CompanyDepartment, CreateDepartmentInput } from "@/hooks/useCompanyDepartments";
import { useContacts, Contact } from "@/hooks/useContacts";
import { useAuth } from "@/contexts/AuthContext";
import { CountryFlag } from "@/components/ui/country-flag";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DepartmentBillingDialog } from "./company/DepartmentBillingDialog";

interface CompanyDepartmentsSectionProps {
  companyId: string;
  companyContacts: Contact[];
  companyBillingContactId?: string | null;
  onBillingContactChange?: (contactId: string | null) => void;
}

// Common department roles
const DEPARTMENT_ROLES = [
  { value: "directeur", label: "Directeur" },
  { value: "directeur_adjoint", label: "Directeur adjoint" },
  { value: "responsable", label: "Responsable" },
  { value: "chef_projet", label: "Chef de projet" },
  { value: "ingenieur", label: "Ingénieur" },
  { value: "technicien", label: "Technicien" },
  { value: "assistant", label: "Assistant(e)" },
  { value: "charge_affaires", label: "Chargé d'affaires" },
  { value: "commercial", label: "Commercial" },
  { value: "administratif", label: "Administratif" },
  { value: "autre", label: "Autre" },
];

export function CompanyDepartmentsSection({ 
  companyId, 
  companyContacts,
  companyBillingContactId,
  onBillingContactChange,
}: CompanyDepartmentsSectionProps) {
  const { activeWorkspace } = useAuth();
  const { departments, isLoading, createDepartment, updateDepartment, deleteDepartment } = useCompanyDepartments(companyId);
  const { updateContact } = useContacts();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<CompanyDepartment | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [selectedDeptForBilling, setSelectedDeptForBilling] = useState<CompanyDepartment | null>(null);
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

  const handleOpenRoleDialog = (contact: Contact) => {
    setEditingContact(contact);
    setSelectedRole((contact as any).department_role || "");
    setRoleDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (editingContact) {
      updateContact.mutate({ 
        id: editingContact.id, 
        department_role: selectedRole || null 
      } as any);
      setRoleDialogOpen(false);
      setEditingContact(null);
    }
  };

  const handleSetBillingContact = (deptId: string | null, contactId: string) => {
    if (deptId) {
      // Set billing contact for department
      updateDepartment.mutate({ id: deptId, billing_contact_id: contactId });
    } else {
      // Set billing contact for company
      onBillingContactChange?.(contactId);
    }
  };

  const getContactsForDepartment = (deptId: string) => {
    return companyContacts.filter(c => c.department_id === deptId);
  };

  const unassignedContacts = companyContacts.filter(c => !c.department_id);

  const getRoleLabel = (role: string | null | undefined) => {
    if (!role) return null;
    return DEPARTMENT_ROLES.find(r => r.value === role)?.label || role;
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const targetDepartmentId = destination.droppableId === "unassigned" ? null : destination.droppableId;
    handleAssignContact(draggableId, targetDepartmentId);
  };

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

  // Contact Card Component
  const ContactCard = ({ 
    contact, 
    isDragging, 
    departmentId,
    isBillingContact,
    isManager,
  }: { 
    contact: Contact; 
    isDragging?: boolean;
    departmentId: string | null;
    isBillingContact?: boolean;
    isManager?: boolean;
  }) => {
    const role = (contact as any).department_role;
    
    return (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg bg-card border transition-all group",
          isDragging && "shadow-lg ring-2 ring-primary/20",
          "hover:border-primary/30"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
        
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={contact.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {contact.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              to={`/crm/contacts/${contact.id}`}
              className="text-sm font-medium hover:text-primary transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {contact.name}
            </Link>
            {isManager && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>Responsable</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isBillingContact && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                  </TooltipTrigger>
                  <TooltipContent>Contact facturation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {(role || contact.role) && (
            <p className="text-xs text-muted-foreground truncate">
              {getRoleLabel(role) || contact.role}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {contact.email && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()}>
                <Mail className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {contact.phone && (
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
              <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()}>
                <Phone className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenRoleDialog(contact)}>
                <Briefcase className="h-4 w-4 mr-2" />
                Définir le rôle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetBillingContact(departmentId, contact.id)}>
                <Receipt className="h-4 w-4 mr-2" />
                Contact facturation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAssignContact(contact.id, null)}>
                <Users className="h-4 w-4 mr-2" />
                Désassigner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            Groupes
            <Badge variant="secondary" className="ml-1 text-xs">
              Glisser-déposer
            </Badge>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {departments.length === 0 && unassignedContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun groupe</p>
              <p className="text-xs mt-1">Créez des groupes pour organiser vos contacts</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-4">
                {departments.map((dept) => {
                  const deptContacts = getContactsForDepartment(dept.id);
                  const manager = deptContacts.find(c => c.id === dept.manager_contact_id);
                  const billingContact = deptContacts.find(c => c.id === (dept as any).billing_contact_id);
                  
                  return (
                    <Droppable key={dept.id} droppableId={dept.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "border rounded-lg p-4 transition-colors",
                            snapshot.isDraggingOver && "bg-primary/5 border-primary/30"
                          )}
                        >
                          {/* Department Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{dept.name}</h4>
                                <Badge variant="outline" className="text-[10px]">
                                  {deptContacts.length} contact{deptContacts.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                              {dept.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {dept.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {dept.location && (
                                  <span className="flex items-center gap-1">
                                    <CountryFlag location={dept.location} size="xs" />
                                    <MapPin className="h-3 w-3" />
                                    {dept.location}
                                  </span>
                                )}
                                {manager && (
                                  <span className="flex items-center gap-1">
                                    <Crown className="h-3 w-3 text-amber-500" />
                                    {manager.name}
                                  </span>
                                )}
                                {billingContact && (
                                  <span className="flex items-center gap-1">
                                    <Receipt className="h-3 w-3 text-emerald-500" />
                                    {billingContact.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(dept)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedDeptForBilling(dept);
                                  setBillingDialogOpen(true);
                                }}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Coordonnées facturation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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

                          {/* Contacts Grid */}
                          <div className={cn(
                            "grid grid-cols-1 md:grid-cols-2 gap-2 min-h-[48px]",
                            deptContacts.length === 0 && "border-2 border-dashed rounded-lg"
                          )}>
                            {deptContacts.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4 col-span-2">
                                Glissez des contacts ici
                              </p>
                            ) : (
                              deptContacts.map((contact, index) => (
                                <Draggable key={contact.id} draggableId={contact.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <ContactCard
                                        contact={contact}
                                        isDragging={snapshot.isDragging}
                                        departmentId={dept.id}
                                        isBillingContact={contact.id === (dept as any).billing_contact_id}
                                        isManager={contact.id === dept.manager_contact_id}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}

                {/* Unassigned contacts */}
                {(unassignedContacts.length > 0 || departments.length > 0) && (
                  <Droppable droppableId="unassigned">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "border border-dashed rounded-lg p-4 bg-muted/10 transition-colors",
                          snapshot.isDraggingOver && "bg-muted/30 border-muted-foreground/30"
                        )}
                      >
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">Non assignés ({unassignedContacts.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 min-h-[40px]">
                          {unassignedContacts.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 col-span-3">
                              Glissez des contacts ici pour les désassigner
                            </p>
                          ) : (
                            unassignedContacts.map((contact, index) => (
                              <Draggable key={contact.id} draggableId={contact.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <ContactCard
                                      contact={contact}
                                      isDragging={snapshot.isDragging}
                                      departmentId={null}
                                      isBillingContact={contact.id === companyBillingContactId}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Department Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Modifier le groupe" : "Nouveau groupe"}
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
                placeholder="Description du groupe..."
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

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rôle dans le groupe</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Rôle de {editingContact?.name}</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner un rôle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Aucun rôle spécifique</SelectItem>
                {DEPARTMENT_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Billing Dialog */}
      {selectedDeptForBilling && activeWorkspace && (
        <DepartmentBillingDialog
          open={billingDialogOpen}
          onOpenChange={(open) => {
            setBillingDialogOpen(open);
            if (!open) setSelectedDeptForBilling(null);
          }}
          departmentId={selectedDeptForBilling.id}
          departmentName={selectedDeptForBilling.name}
          workspaceId={activeWorkspace.id}
        />
      )}
    </>
  );
}
