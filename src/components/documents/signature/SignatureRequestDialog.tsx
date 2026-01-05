import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Send, Calendar } from "lucide-react";
import { useDocumentSignatures } from "@/hooks/useDocumentSignatures";
import { format, addDays } from "date-fns";

interface SignatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

interface Signer {
  signer_email: string;
  signer_name: string;
  signer_role: 'client' | 'agency' | 'witness' | 'other';
  sign_order: number;
}

export function SignatureRequestDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: SignatureRequestDialogProps) {
  const { createSignature } = useDocumentSignatures(documentId);
  const [signers, setSigners] = useState<Signer[]>([
    { signer_email: "", signer_name: "", signer_role: "client", sign_order: 1 },
  ]);
  const [message, setMessage] = useState("");
  const [expiresIn, setExpiresIn] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSigner = () => {
    setSigners([
      ...signers,
      {
        signer_email: "",
        signer_name: "",
        signer_role: "client",
        sign_order: signers.length + 1,
      },
    ]);
  };

  const removeSigner = (index: number) => {
    if (signers.length === 1) return;
    const newSigners = signers.filter((_, i) => i !== index);
    // Recalculate sign order
    setSigners(newSigners.map((s, i) => ({ ...s, sign_order: i + 1 })));
  };

  const updateSigner = (index: number, field: keyof Signer, value: string | number) => {
    const newSigners = [...signers];
    newSigners[index] = { ...newSigners[index], [field]: value };
    setSigners(newSigners);
  };

  const handleSubmit = async () => {
    // Validate
    const validSigners = signers.filter(s => s.signer_email && s.signer_name);
    if (validSigners.length === 0) return;

    setIsSubmitting(true);
    try {
      const expiresAt = addDays(new Date(), parseInt(expiresIn));
      
      await createSignature.mutateAsync({
        document_id: documentId,
        message: message || undefined,
        expires_at: expiresAt.toISOString(),
        signers: validSigners,
      });

      onOpenChange(false);
      setSigners([{ signer_email: "", signer_name: "", signer_role: "client", sign_order: 1 }]);
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    client: "Client",
    agency: "Agence",
    witness: "Témoin",
    other: "Autre",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Demander une signature</DialogTitle>
          <DialogDescription>
            Envoyez une demande de signature pour le document : {documentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Signers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Signataires</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSigner}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30">
                  <Badge variant="outline" className="mt-2">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nom complet"
                      value={signer.signer_name}
                      onChange={(e) => updateSigner(index, "signer_name", e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={signer.signer_email}
                      onChange={(e) => updateSigner(index, "signer_email", e.target.value)}
                    />
                    <Select
                      value={signer.signer_role}
                      onValueChange={(v) => updateSigner(index, "signer_role", v as Signer['signer_role'])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSigner(index)}
                    disabled={signers.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Ajoutez un message pour les signataires..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label>Délai de signature</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="14">14 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="60">60 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                Expire le {format(addDays(new Date(), parseInt(expiresIn)), "dd/MM/yyyy")}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || signers.every(s => !s.signer_email || !s.signer_name)}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
