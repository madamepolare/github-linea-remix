import { useAuth } from "@/contexts/AuthContext";

export function WelcomeHeader() {
  const { profile } = useAuth();
  const now = new Date();
  const hour = now.getHours();
  
  const getGreeting = () => {
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bonjour";
    return "Bonsoir";
  };

  const formatDate = () => {
    return now.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const firstName = profile?.full_name?.split(" ")[0] || "";

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground capitalize">{formatDate()}</p>
        <h2 className="text-2xl font-semibold text-foreground mt-1">
          {getGreeting()}{firstName && `, ${firstName}`}
        </h2>
      </div>
    </div>
  );
}
