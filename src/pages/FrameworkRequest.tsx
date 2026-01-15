import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FrameworkRequestForm } from "@/components/portal/FrameworkRequestForm";
import { RequestSuccess } from "@/components/portal/RequestSuccess";
import { Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function FrameworkRequest() {
  const { token } = useParams<{ token: string }>();
  const [submitted, setSubmitted] = useState(false);

  const { data: portalData, isLoading, error } = useQuery({
    queryKey: ["framework-portal", token],
    queryFn: async () => {
      if (!token) throw new Error("Token manquant");

      const { data, error } = await supabase.functions.invoke("client-portal-view", {
        body: { token },
      });

      if (error) throw error;
      if (!data) throw new Error("Portail non trouvé");
      
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Lien invalide</h1>
          <p className="text-muted-foreground">
            Ce lien de demande n'existe pas ou a expiré. Veuillez contacter votre interlocuteur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <RequestSuccess contactName={portalData.contact?.name} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <FrameworkRequestForm
          token={token!}
          portalData={portalData}
          onSuccess={() => setSubmitted(true)}
        />
      </div>
    </div>
  );
}
