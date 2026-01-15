import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface RequestSuccessProps {
  contactName?: string;
}

export function RequestSuccess({ contactName }: RequestSuccessProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardContent className="pt-12 pb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold mb-2">Demande envoyée !</h1>
            <p className="text-muted-foreground mb-6">
              {contactName ? (
                <>
                  Merci {contactName}, votre demande a bien été transmise à notre équipe.
                  Nous reviendrons vers vous dans les plus brefs délais.
                </>
              ) : (
                <>
                  Votre demande a bien été transmise à notre équipe.
                  Nous reviendrons vers vous dans les plus brefs délais.
                </>
              )}
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                📧 Vous recevrez une confirmation par email avec les détails de votre demande.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Soumettre une autre demande
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
