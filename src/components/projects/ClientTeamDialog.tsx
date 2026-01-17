import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProjectContacts, CLIENT_TEAM_ROLES } from "@/hooks/useProjectContacts";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Plus, X, Star, Users, Mail, Phone, Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  companyId?: string | null;
  companyName?: string | null;
}

export function ClientTeamDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  companyId,
  companyName,
}: ClientTeamDialogProps) {
  const {
    contacts: projectContacts,
    isLoading,
    addContact,
    updateContact,
    removeContact,
  } = useProjectContacts(projectId);

  const { contacts: allContacts } = useContacts();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("chef_projet");

  // Filter contacts - prefer those from the same company
  const availableContacts = allContacts.filter(
    (c) => !projectContacts.some((pc) => pc.contact_id === c.id)
  );

  const companyContacts = availableContacts.filter(
    (c) => c.crm_company_id === companyId
  );
  const otherContacts = availableContacts.filter(
    (c) => c.crm_company_id !== companyId
  );

  const handleAddContact = () => {
    if (!selectedContactId) return;

    addContact.mutate(
      {
        contactId: selectedContactId,
        role: selectedRole,
        isPrimary: projectContacts.length === 0,
      },
      {
        onSuccess: () => {
          setSelectedContactId(null);
          setSelectedRole("chef_projet");
          setIsAddOpen(false);
        },
      }
    );
  };

  const handleSetPrimary = (id: string) => {
    updateContact.mutate({ id, is_primary: true });
  };

  const handleUpdateRole = (id: string, role: string) => {
    updateContact.mutate({ id, role });
  };

  const handleRemove = (id: string) => {
    removeContact.mutate(id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    return CLIENT_TEAM_ROLES.find((r) => r.value === role)?.label || role;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Équipe client
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Interlocuteurs côté client pour {projectName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Company info */}
          {companyName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/30 border">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{companyName}</span>
            </div>
          )}

          {/* Add button */}
          <div className="flex justify-end">
            <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Ajouter un contact
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="end">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Contact</Label>
                    <Command className="border rounded-md">
                      <CommandInput
                        placeholder="Rechercher un contact..."
                        className="h-8"
                      />
                      <CommandList className="max-h-48">
                        <CommandEmpty>Aucun contact trouvé</CommandEmpty>
                        {companyContacts.length > 0 && (
                          <CommandGroup heading="Contacts du client">
                            {companyContacts.map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={contact.name}
                                onSelect={() => setSelectedContactId(contact.id)}
                                className="flex items-center gap-2"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={contact.avatar_url || undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(contact.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{contact.name}</p>
                                  {contact.role && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {contact.role}
                                    </p>
                                  )}
                                </div>
                                {selectedContactId === contact.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {otherContacts.length > 0 && (
                          <CommandGroup heading="Autres contacts">
                            {otherContacts.slice(0, 10).map((contact) => (
                              <CommandItem
                                key={contact.id}
                                value={contact.name}
                                onSelect={() => setSelectedContactId(contact.id)}
                                className="flex items-center gap-2"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={contact.avatar_url || undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(contact.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{contact.name}</p>
                                  {contact.role && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {contact.role}
                                    </p>
                                  )}
                                </div>
                                {selectedContactId === contact.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Rôle sur le projet</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_TEAM_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleAddContact}
                    disabled={!selectedContactId || addContact.isPending}
                  >
                    Ajouter au projet
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Contacts list */}
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Chargement...
            </div>
          ) : projectContacts.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium">Aucun contact côté client</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajoutez les interlocuteurs du client pour ce projet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projectContacts.map((pc) => (
                <div
                  key={pc.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card",
                    pc.is_primary && "border-primary/30 bg-primary/5"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={pc.contact?.avatar_url || undefined} />
                    <AvatarFallback>
                      {pc.contact ? getInitials(pc.contact.name) : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {pc.contact?.name}
                      </span>
                      {pc.is_primary && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {pc.contact?.email && (
                        <a
                          href={`mailto:${pc.contact.email}`}
                          className="flex items-center gap-1 hover:text-foreground truncate"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{pc.contact.email}</span>
                        </a>
                      )}
                      {pc.contact?.phone && (
                        <a
                          href={`tel:${pc.contact.phone}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          {pc.contact.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={pc.role}
                      onValueChange={(v) => handleUpdateRole(pc.id, v)}
                    >
                      <SelectTrigger className="h-8 text-xs w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_TEAM_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!pc.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSetPrimary(pc.id)}
                        title="Définir comme contact principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(pc.id)}
                      title="Retirer du projet"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
