import { useState } from "react";
import { useProjectContacts, CLIENT_TEAM_ROLES } from "@/hooks/useProjectContacts";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, X, Star, Users, Mail, Phone, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectContactsManagerProps {
  projectId: string;
  companyId?: string | null;
  compact?: boolean;
}

export function ProjectContactsManager({ 
  projectId, 
  companyId,
  compact = false 
}: ProjectContactsManagerProps) {
  const { 
    contacts: projectContacts, 
    isLoading, 
    addContact, 
    updateContact, 
    removeContact 
  } = useProjectContacts(projectId);
  
  const { contacts: allContacts } = useContacts();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("chef_projet");

  // Filter contacts - prefer those from the same company
  const availableContacts = allContacts.filter(
    c => !projectContacts.some(pc => pc.contact_id === c.id)
  );
  
  const companyContacts = availableContacts.filter(c => c.crm_company_id === companyId);
  const otherContacts = availableContacts.filter(c => c.crm_company_id !== companyId);

  const handleAddContact = () => {
    if (!selectedContactId) return;
    
    addContact.mutate({
      contactId: selectedContactId,
      role: selectedRole,
      isPrimary: projectContacts.length === 0,
    }, {
      onSuccess: () => {
        setSelectedContactId(null);
        setSelectedRole("chef_projet");
        setIsAddOpen(false);
      }
    });
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
    return CLIENT_TEAM_ROLES.find(r => r.value === role)?.label || role;
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Équipe client
        </Label>
        <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1">
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="end">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Contact</Label>
                <Command className="border rounded-md">
                  <CommandInput placeholder="Rechercher un contact..." className="h-8" />
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
                              <AvatarImage src={contact.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{contact.name}</p>
                              {contact.role && (
                                <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
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
                              <AvatarImage src={contact.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{contact.name}</p>
                              {contact.role && (
                                <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
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
                <Label className="text-xs">Rôle</Label>
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
                Ajouter le contact
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {projectContacts.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>Aucun contact côté client</p>
          <p className="text-xs">Ajoutez les interlocuteurs du client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projectContacts.map((pc) => (
            <div 
              key={pc.id} 
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border bg-card",
                pc.is_primary && "border-primary/30 bg-primary/5"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={pc.contact?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {pc.contact ? getInitials(pc.contact.name) : "?"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {pc.contact?.name}
                  </span>
                  {pc.is_primary && (
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {pc.contact?.email && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3" />
                      {pc.contact.email}
                    </span>
                  )}
                  {pc.contact?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {pc.contact.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Select 
                  value={pc.role} 
                  onValueChange={(v) => handleUpdateRole(pc.id, v)}
                >
                  <SelectTrigger className="h-7 text-xs w-[130px]">
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
                    className="h-7 w-7"
                    onClick={() => handleSetPrimary(pc.id)}
                    title="Définir comme contact principal"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(pc.id)}
                  title="Retirer du projet"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
