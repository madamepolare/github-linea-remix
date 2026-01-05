import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  Clock, 
  Eye, 
  XCircle, 
  Send,
  User,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DocumentSignature, DocumentSigner, SignatureEvent } from "@/hooks/useDocumentSignatures";

interface SignatureTrackingPanelProps {
  signature: DocumentSignature;
  events?: SignatureEvent[];
}

export function SignatureTrackingPanel({ signature, events = [] }: SignatureTrackingPanelProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'viewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signé';
      case 'viewed':
        return 'Consulté';
      case 'rejected':
        return 'Refusé';
      default:
        return 'En attente';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'signed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'viewed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <Send className="h-3 w-3" />;
      case 'sent':
        return <Mail className="h-3 w-3" />;
      case 'viewed':
        return <Eye className="h-3 w-3" />;
      case 'signed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return 'Demande créée';
      case 'sent':
        return 'Email envoyé';
      case 'viewed':
        return 'Document consulté';
      case 'signed':
        return 'Document signé';
      case 'rejected':
        return 'Signature refusée';
      case 'reminder_sent':
        return 'Rappel envoyé';
      case 'expired':
        return 'Demande expirée';
      case 'cancelled':
        return 'Demande annulée';
      default:
        return eventType;
    }
  };

  const signedCount = signature.signers?.filter(s => s.status === 'signed').length || 0;
  const totalSigners = signature.signers?.length || 0;
  const progress = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Progression</CardTitle>
            <Badge variant={signature.status === 'completed' ? 'default' : 'secondary'}>
              {signature.status === 'completed' ? 'Terminé' :
               signature.status === 'rejected' ? 'Refusé' :
               signature.status === 'cancelled' ? 'Annulé' :
               signature.status === 'expired' ? 'Expiré' : 'En cours'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Signatures</span>
              <span className="font-medium">{signedCount} / {totalSigners}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signers List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Signataires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {signature.signers?.map((signer) => (
              <div 
                key={signer.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{signer.signer_name}</p>
                    <p className="text-xs text-muted-foreground">{signer.signer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(signer.status)}
                  <Badge variant={getStatusBadgeVariant(signer.status)}>
                    {getStatusLabel(signer.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="w-px h-full bg-border" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-sm font-medium">{getEventLabel(event.event_type)}</p>
                      {event.signer && (
                        <p className="text-xs text-muted-foreground">
                          par {event.signer.signer_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
