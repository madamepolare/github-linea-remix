import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="Politique de Confidentialité | Linea Suite"
        description="Découvrez comment Linea Suite protège vos données personnelles et respecte votre vie privée."
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-32 pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground mb-8">
              Dernière mise à jour : 1er janvier 2026
            </p>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                <p className="text-muted-foreground">
                  Linea Suite SAS s'engage à protéger la vie privée de ses utilisateurs. 
                  Cette politique de confidentialité explique comment nous collectons, utilisons 
                  et protégeons vos données personnelles conformément au RGPD.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Données collectées</h2>
                <p className="text-muted-foreground mb-4">
                  Nous collectons les données suivantes :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Informations d'identification : nom, prénom, email, téléphone</li>
                  <li>Données professionnelles : nom d'agence, fonction</li>
                  <li>Données d'utilisation : connexions, actions dans l'application</li>
                  <li>Données de facturation : adresse, informations de paiement</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Utilisation des données</h2>
                <p className="text-muted-foreground mb-4">
                  Vos données sont utilisées pour :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Fournir et améliorer nos services</li>
                  <li>Gérer votre compte et vos abonnements</li>
                  <li>Vous envoyer des communications liées au service</li>
                  <li>Assurer le support client</li>
                  <li>Respecter nos obligations légales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Partage des données</h2>
                <p className="text-muted-foreground">
                  Nous ne vendons jamais vos données. Elles peuvent être partagées avec nos 
                  sous-traitants techniques (hébergement, paiement) dans le respect du RGPD. 
                  Tous nos partenaires sont soumis à des accords de confidentialité stricts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Sécurité</h2>
                <p className="text-muted-foreground">
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                  pour protéger vos données : chiffrement SSL/TLS, authentification forte, 
                  sauvegardes régulières, accès restreint aux données.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Conservation</h2>
                <p className="text-muted-foreground">
                  Vos données sont conservées pendant la durée de votre abonnement et 3 ans 
                  après sa résiliation, sauf obligation légale de conservation plus longue.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Vos droits</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Droit d'accès à vos données</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement</li>
                  <li>Droit à la portabilité</li>
                  <li>Droit d'opposition</li>
                  <li>Droit de limitation du traitement</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies</h2>
                <p className="text-muted-foreground">
                  Nous utilisons des cookies essentiels au fonctionnement du service et des 
                  cookies analytiques pour améliorer notre plateforme. Vous pouvez gérer vos 
                  préférences dans les paramètres de votre navigateur.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact DPO</h2>
                <p className="text-muted-foreground">
                  Pour exercer vos droits ou toute question sur vos données :<br />
                  Email : dpo@lineasuite.com<br />
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
