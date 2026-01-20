import { useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Smartphone, AlertCircle, BellRing } from "lucide-react";
import { IOSInstallPrompt } from "./IOSInstallPrompt";

export function PushNotificationToggle() {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    permission,
    subscribe, 
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();
  
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    await sendTestNotification();
    setIsSendingTest(false);
  };

  if (!isSupported) {
    return (
      <div className="flex items-start justify-between gap-4 py-3 opacity-60">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Notifications push navigateur
            </Label>
            <p className="text-xs text-muted-foreground">
              Non supporté par votre navigateur
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Non disponible
        </Badge>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-start justify-between gap-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Notifications push navigateur
            </Label>
            <p className="text-xs text-destructive">
              Bloquées par le navigateur. Modifiez les paramètres de votre navigateur pour autoriser les notifications.
            </p>
          </div>
        </div>
        <Badge variant="destructive" className="text-xs">
          Bloqué
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <Label htmlFor="push_browser" className="text-sm font-medium cursor-pointer">
            Notifications push navigateur
          </Label>
          <p className="text-xs text-muted-foreground">
            Recevoir des alertes même quand l'application n'est pas ouverte
          </p>
          {isSubscribed && (
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs">
                Activé sur cet appareil
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleSendTest}
                disabled={isSendingTest}
              >
                {isSendingTest ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <BellRing className="h-3 w-3 mr-1" />
                )}
                Tester
              </Button>
            </div>
          )}
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          id="push_browser"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
        />
      )}
    </div>
  );
}
