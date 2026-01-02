import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Pencil,
  Trash2,
  Eye,
  Users,
  ExternalLink,
} from "lucide-react";
import { useContacts, Contact } from "@/hooks/useContacts";
import { ContactDetailSheet } from "./ContactDetailSheet";
import { EditContactDialog } from "./EditContactDialog";

const contactTypeLabels: Record<string, string> = {
  client: "Client",
  amo: "AMO",
  bet: "BET",
  entreprise: "Entreprise",
  fournisseur: "Fournisseur",
  partenaire: "Partenaire",
  partner: "Partenaire",
  supplier: "Fournisseur",
};

const contactTypeColors: Record<string, string> = {
  client: "bg-emerald-500",
  amo: "bg-cyan-500",
  bet: "bg-orange-500",
  entreprise: "bg-amber-500",
  fournisseur: "bg-purple-500",
  partenaire: "bg-pink-500",
  partner: "bg-pink-500",
  supplier: "bg-purple-500",
};

export interface CRMContactsTableProps {
  search?: string;
  onCreateContact: () => void;
}

export function CRMContactsTable({ search = "", onCreateContact }: CRMContactsTableProps) {
  const navigate = useNavigate();
  const { contacts, isLoading, deleteContact } = useContacts();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    
    const searchLower = search.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.company?.name?.toLowerCase().includes(searchLower) ||
        contact.role?.toLowerCase().includes(searchLower)
    );
  }, [contacts, search]);

  if (isLoading) {
    return (
      <Card className="m-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
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

  if (contacts.length === 0) {
    return (
      <Card className="m-6">
        <CardContent className="p-6">
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description="Ajoutez votre premier contact pour commencer à gérer vos relations clients."
            action={{ label: "Créer un contact", onClick: onCreateContact }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun contact trouvé pour "{search}"</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Contact</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact, index) => (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={contact.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {contact.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              {contact.role && (
                                <p className="text-sm text-muted-foreground">{contact.role}</p>
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
                          {contact.contact_type && (
                            <Badge variant="outline" className="gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${contactTypeColors[contact.contact_type] || "bg-neutral-500"}`} />
                              {contactTypeLabels[contact.contact_type] || contact.contact_type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-foreground"
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-foreground"
                              >
                                <Phone className="h-4 w-4" />
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
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContact(contact);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Aperçu rapide
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/crm/contacts/${contact.id}`);
                              }}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir page détail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setEditingContact(contact);
                              }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteContact.mutate(contact.id);
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
      </div>

      <ContactDetailSheet
        contact={selectedContact}
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      />

      <EditContactDialog
        contact={editingContact}
        open={!!editingContact}
        onOpenChange={(open) => !open && setEditingContact(null)}
      />
    </>
  );
}
