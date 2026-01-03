import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function CGV() {
  return (
    <>
      <SEOHead
        title="Conditions Générales de Vente | Linea Suite"
        description="Consultez les conditions générales de vente de Linea Suite."
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-32 pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Conditions Générales de Vente
            </h1>
            <p className="text-muted-foreground mb-8">
              Dernière mise à jour : 1er janvier 2026
            </p>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Objet</h2>
                <p className="text-muted-foreground">
                  Les présentes conditions générales de vente (CGV) régissent les relations 
                  contractuelles entre Linea Suite SAS et ses clients dans le cadre de la 
                  souscription aux services proposés sur la plateforme lineasuite.com.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Services proposés</h2>
                <p className="text-muted-foreground">
                  Linea Suite propose une plateforme SaaS de gestion pour agences d'architecture 
                  comprenant les modules suivants : gestion de projets, CRM, devis et facturation, 
                  appels d'offres, planning chantier et collaboration.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Tarification</h2>
                <p className="text-muted-foreground mb-4">
                  Les prix sont indiqués en euros hors taxes. Trois formules sont proposées :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Starter : Gratuit, limité à 1 utilisateur et 3 projets</li>
                  <li>Pro : 49€/mois ou 39€/mois en facturation annuelle</li>
                  <li>Enterprise : Sur devis, selon les besoins spécifiques</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Modalités de paiement</h2>
                <p className="text-muted-foreground">
                  Le paiement s'effectue par carte bancaire via notre prestataire de paiement 
                  sécurisé Stripe. La facturation est mensuelle ou annuelle selon l'option choisie. 
                  Les factures sont disponibles dans l'espace client.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Durée et résiliation</h2>
                <p className="text-muted-foreground">
                  L'abonnement est souscrit pour une durée indéterminée. Le client peut résilier 
                  à tout moment depuis son espace client. La résiliation prend effet à la fin de 
                  la période de facturation en cours.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Propriété intellectuelle</h2>
                <p className="text-muted-foreground">
                  Linea Suite conserve l'intégralité des droits de propriété intellectuelle sur 
                  la plateforme. Le client conserve la propriété de ses données et contenus.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Responsabilité</h2>
                <p className="text-muted-foreground">
                  Linea Suite s'engage à fournir un service de qualité avec une disponibilité 
                  de 99,9%. En cas de dysfonctionnement, la responsabilité de Linea Suite est 
                  limitée au montant des sommes versées au cours des 12 derniers mois.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question relative aux présentes CGV :<br />
                  Email : legal@lineasuite.com<br />
                  Adresse : 42 rue de l'Innovation, 75011 Paris, France
                </p>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
