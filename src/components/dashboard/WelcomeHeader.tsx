import { useAuth } from "@/contexts/AuthContext";

export function WelcomeHeader() {
  const { profile } = useAuth();
  const now = new Date();
  const hour = now.getHours();
  
  const getGreeting = () => {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () => {
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>
      <div className="flex items-center gap-4 mt-4 sm:mt-0">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">{formatDate()}</span>
        </div>
      </div>
    </div>
  );
}
