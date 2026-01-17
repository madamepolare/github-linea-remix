import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useProjectContacts } from "@/hooks/useProjectContacts";
import { useProjectMembers } from "@/hooks/useProjects";
import { toast } from "sonner";
import { 
  Send, 
  Loader2, 
  Link2, 
  Users, 
  User, 
  Mail,
  Clock,
  Check,
  Sparkles
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Recipient {
  id: string;
  email: string;
  name: string;
  type: "contact" | "team";
  role?: string;
  avatarUrl?: string | null;
  selected: boolean;
}

interface DeliverableEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: {
    id: string;
    name: string;
    description?: string | null;
    file_url?: string | null;
    email_template?: string | null;
    email_link?: string | null;
    email_sent_at?: string | null;
    email_sent_to?: string[] | null;
    phase?: {
      id: string;
      name: string;
      color?: string | null;
    } | null;
  };
  projectId: string;
  projectName: string;
  onEmailSent?: () => void;
}

export function DeliverableEmailDialog({
  open,
  onOpenChange,
  deliverable,
  projectId,
  projectName,
  onEmailSent,
}: DeliverableEmailDialogProps) {
  const { contacts } = useProjectContacts(projectId);
  const { members } = useProjectMembers(projectId);
  
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [customEmail, setCustomEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [template, setTemplate] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize recipients when dialog opens
  useEffect(() => {
    if (open) {
      const allRecipients: Recipient[] = [];
      
      // Add project contacts with email
      contacts?.forEach((pc) => {
        if (pc.contact?.email) {
          allRecipients.push({
            id: pc.contact.id,
            email: pc.contact.email,
            name: pc.contact.name,
            type: "contact",
            role: pc.role,
            avatarUrl: pc.contact.avatar_url,
            selected: pc.role === "operational" || pc.is_primary, // Pre-select operational contacts
          });
        }
      });

      // Add team members with email (fetch profiles to get emails)
      members?.forEach((m) => {
        if (m.profile) {
          // We'll need to fetch email from auth or assume they have workspace email
          allRecipients.push({
            id: m.user_id,
            email: "", // Will be populated if we have it
            name: m.profile.full_name || "Membre équipe",
            type: "team",
            role: m.role,
            avatarUrl: m.profile.avatar_url,
            selected: false,
          });
        }
      });

      setRecipients(allRecipients);
      setSubject(`Livrable: ${deliverable.name} - ${projectName}`);
      setTemplate(deliverable.email_template || getDefaultTemplate());
      setDriveLink(deliverable.email_link || deliverable.file_url || "");
    }
  }, [open, contacts, members, deliverable, projectName]);

  const getDefaultTemplate = () => {
    return `Bonjour,

Veuillez trouver ci-joint le livrable "${deliverable.name}" pour le projet "${projectName}".

${deliverable.phase ? `Phase: ${deliverable.phase.name}` : ""}
${deliverable.description ? `\nDescription: ${deliverable.description}` : ""}

[LIEN_TELECHARGEMENT]

N'hésitez pas à revenir vers nous si vous avez des questions.

Cordialement,
L'équipe projet`;
  };

  const toggleRecipient = (id: string) => {
    setRecipients(prev => 
      prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r)
    );
  };

  const addCustomEmail = () => {
    if (!customEmail || !customEmail.includes("@")) return;
    
    // Check if already exists
    if (recipients.some(r => r.email.toLowerCase() === customEmail.toLowerCase())) {
      toast.error("Cet email est déjà dans la liste");
      return;
    }

    setRecipients(prev => [...prev, {
      id: `custom-${Date.now()}`,
      email: customEmail,
      name: customEmail,
      type: "contact",
      selected: true,
    }]);
    setCustomEmail("");
  };

  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-deliverable-email", {
        body: {
          deliverableName: deliverable.name,
          projectName,
          phaseName: deliverable.phase?.name,
          description: deliverable.description,
          dropboxLink: driveLink || undefined,
        },
      });

      if (error) throw error;

      if (data?.body) {
        setTemplate(data.body);
        if (data.subject) setSubject(data.subject);
        toast.success("Template généré");
      }
    } catch (error: any) {
      console.error("Error generating email template:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    const selectedRecipients = recipients.filter(r => r.selected && r.email);
    
    if (selectedRecipients.length === 0) {
      toast.error("Sélectionnez au moins un destinataire avec email");
      return;
    }

    setIsSending(true);
    try {
      // Prepare email body with link
      let emailBody = template;
      if (driveLink) {
        emailBody = emailBody.replace("[LIEN_TELECHARGEMENT]", `Lien de téléchargement: ${driveLink}`);
      } else {
        emailBody = emailBody.replace("[LIEN_TELECHARGEMENT]", "");
      }

      // Send to each recipient
      const emailPromises = selectedRecipients.map(recipient => 
        supabase.functions.invoke("send-deliverable-email", {
          body: {
            to: recipient.email,
            subject,
            deliverableName: deliverable.name,
            projectName,
            phaseName: deliverable.phase?.name,
            description: emailBody,
            fileUrl: driveLink || undefined,
          },
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(r => r.status === "fulfilled").length;
      const failedCount = results.filter(r => r.status === "rejected").length;

      // Update deliverable with email tracking info
      const sentEmails = selectedRecipients.map(r => r.email);
      await supabase
        .from("project_deliverables")
        .update({
          email_template: template,
          email_link: driveLink || null,
          email_sent_at: new Date().toISOString(),
          email_sent_to: sentEmails,
          status: "delivered",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", deliverable.id);

      if (failedCount > 0) {
        toast.warning(`${successCount} email(s) envoyé(s), ${failedCount} échec(s)`);
      } else {
        toast.success(`${successCount} email(s) envoyé(s) avec succès`);
      }

      onEmailSent?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error sending emails:", error);
      toast.error("Erreur lors de l'envoi: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = recipients.filter(r => r.selected).length;
  const contactsWithEmail = recipients.filter(r => r.type === "contact");
  const teamWithEmail = recipients.filter(r => r.type === "team");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envoyer le livrable par email
          </DialogTitle>
          <DialogDescription>
            Envoyez "{deliverable.name}" aux contacts et membres de l'équipe.
          </DialogDescription>
        </DialogHeader>

        {/* Previous send info */}
        {deliverable.email_sent_at && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-700 dark:text-green-300">
              Dernier envoi le {format(parseISO(deliverable.email_sent_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              {deliverable.email_sent_to && ` à ${deliverable.email_sent_to.length} destinataire(s)`}
            </span>
          </div>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Recipients */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinataires
                <Badge variant="secondary" className="ml-auto">
                  {selectedCount} sélectionné(s)
                </Badge>
              </Label>
              
              {/* Project contacts */}
              {contactsWithEmail.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground font-medium">Contacts projet</span>
                  <div className="grid gap-2">
                    {contactsWithEmail.map((recipient) => (
                      <div
                        key={recipient.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                          recipient.selected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleRecipient(recipient.id)}
                      >
                        <Checkbox checked={recipient.selected} />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={recipient.avatarUrl || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{recipient.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{recipient.email}</div>
                        </div>
                        {recipient.role && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {recipient.role === "operational" ? "Opérationnel" :
                             recipient.role === "billing" ? "Facturation" :
                             recipient.role === "decision_maker" ? "Décisionnaire" :
                             recipient.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team members */}
              {teamWithEmail.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground font-medium">Équipe projet</span>
                  <div className="grid gap-2">
                    {teamWithEmail.map((recipient) => (
                      <div
                        key={recipient.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                          recipient.selected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50",
                          !recipient.email && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => recipient.email && toggleRecipient(recipient.id)}
                      >
                        <Checkbox checked={recipient.selected} disabled={!recipient.email} />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={recipient.avatarUrl || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{recipient.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {recipient.email || "Pas d'email"}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">Équipe</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom email */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Ajouter un email..."
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomEmail()}
                  className="flex-1"
                />
                <Button variant="outline" onClick={addCustomEmail} disabled={!customEmail}>
                  Ajouter
                </Button>
              </div>
            </div>

            {/* Drive/Dropbox Link */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Lien Drive / Dropbox
              </Label>
              <Input
                placeholder="https://drive.google.com/... ou https://dropbox.com/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ce lien sera inclus dans l'email pour permettre le téléchargement du livrable.
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Objet de l'email</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Template */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contenu de l'email</Label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleGenerateTemplate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Générer avec IA
                </Button>
              </div>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez [LIEN_TELECHARGEMENT] pour insérer automatiquement le lien.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={selectedCount === 0 || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Envoyer à {selectedCount} destinataire(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
