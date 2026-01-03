import { useState } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, Phone, Send, MessageCircle, Loader2 } from "lucide-react";

export default function Contact() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });

    setIsLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <SEOHead
        title="Contact | Linea Suite - Nous contacter"
        description="Une question sur Linea Suite ? Contactez notre équipe. Nous sommes là pour vous aider à optimiser la gestion de votre agence d'architecture."
        keywords="contact, support, Linea Suite, architecture, aide"
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Contactez-nous
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une question, une suggestion ou besoin d'aide ? Notre équipe est là 
              pour vous accompagner.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="pb-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Nos coordonnées
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="text-primary" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Email</h3>
                        <p className="text-muted-foreground">contact@lineasuite.com</p>
                        <p className="text-muted-foreground">support@lineasuite.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="text-primary" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Téléphone</h3>
                        <p className="text-muted-foreground">+33 1 23 45 67 89</p>
                        <p className="text-sm text-muted-foreground">Lun-Ven, 9h-18h</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="text-primary" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Adresse</h3>
                        <p className="text-muted-foreground">
                          42 rue de l'Innovation<br />
                          75011 Paris, France
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageCircle className="text-primary" size={20} />
                    <h3 className="font-medium text-foreground">Besoin d'aide rapide ?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Consultez notre documentation ou discutez avec notre équipe en direct.
                  </p>
                  <Button variant="outline" className="w-full">
                    Ouvrir le chat
                  </Button>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="p-8 rounded-2xl bg-card border border-border">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Envoyez-nous un message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Jean Dupont"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="jean@agence.fr"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Agence (optionnel)</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Nom de votre agence"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Comment pouvons-nous vous aider ?"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Décrivez votre demande..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Envoyer le message
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
