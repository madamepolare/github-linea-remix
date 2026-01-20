import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Share, 
  Plus, 
  Bell, 
  CheckCircle2,
  ChevronRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IOSInstallPromptProps {
  onDismiss?: () => void;
}

export function IOSInstallPrompt({ onDismiss }: IOSInstallPromptProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (navigator as any).standalone === true;
    setIsStandalone(standalone);
    
    // Check if dismissed before
    const wasDismissed = localStorage.getItem('ios-install-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if not iOS, already installed, or dismissed
  if (!isIOS || isStandalone || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">
                      Installer LINEA sur iPhone
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      iOS 16.4+
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recevez des notifications push en installant l'app sur votre écran d'accueil
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-primary font-semibold text-xs">
                  1
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span>Appuyez sur</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-background">
                    <Share className="h-4 w-4 text-primary" />
                    <span className="font-medium">Partager</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-primary font-semibold text-xs">
                  2
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span>Faites défiler et appuyez</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-background">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="font-medium">Sur l'écran d'accueil</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-primary font-semibold text-xs">
                  3
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span>Confirmez en appuyant</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-background font-medium">
                    Ajouter
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span>Ouvrez l'app et activez les</span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-background">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="font-medium">Notifications</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-amber-500">⚠️</span>
                Les notifications push sur iPhone nécessitent iOS 16.4 ou supérieur
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Composant compact pour afficher dans le toggle
export function IOSInstallBadge() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-6 px-2 text-xs gap-1 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
        onClick={() => setShowPrompt(true)}
      >
        <Smartphone className="h-3 w-3" />
        Installer sur iPhone
        <ChevronRight className="h-3 w-3" />
      </Button>

      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md"
          >
            <IOSInstallPrompt onDismiss={() => setShowPrompt(false)} />
          </motion.div>
        </div>
      )}
    </>
  );
}
