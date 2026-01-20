import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CRMEmailSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('gmail-sync');
      
      if (error) {
        throw error;
      }
      
      toast.success("Emails synchronisés avec succès");
    } catch (error) {
      console.error('Error syncing emails:', error);
      toast.error("Erreur lors de la synchronisation des emails");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-9 w-9"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Synchroniser les emails</p>
      </TooltipContent>
    </Tooltip>
  );
}
