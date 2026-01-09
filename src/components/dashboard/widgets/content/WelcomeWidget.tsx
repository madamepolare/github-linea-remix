import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function WelcomeWidget() {
  const { user } = useAuth();
  const now = new Date();
  const hour = now.getHours();

  let greeting = "Bonjour";
  if (hour >= 18) greeting = "Bonsoir";
  else if (hour < 6) greeting = "Bonne nuit";

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "utilisateur";

  return (
    <div className="flex flex-col justify-center h-full">
      <p className="text-sm text-muted-foreground">
        {format(now, "EEEE d MMMM yyyy", { locale: fr })}
      </p>
      <h2 className="text-2xl font-semibold mt-1">
        {greeting}, {firstName} 👋
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        Voici un aperçu de votre activité
      </p>
    </div>
  );
}
