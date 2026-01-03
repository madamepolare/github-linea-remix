import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function CGV() {
  return (
    <>
      <SEOHead
        title="Conditions Générales de Vente | Linea Suite"
        description="Consultez les conditions générales de vente de Linea Suite - Plateforme SaaS pour architectes."
        keywords="CGV, conditions générales, vente, Linea Suite, architecte"
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
                  contractuelles entre Linea Suite SAS, société par actions simplifiée au capital 
                  de 10 000 euros, immatriculée au RCS de Paris sous le numéro B 123 456 789, 
                  dont le siège social est situé au 42 rue de l'Innovation, 75011 Paris, France 
                  (ci-après « Linea Suite ») et toute personne physique ou morale souscrivant 
                  aux services proposés sur la plateforme lineasuite.com (ci-après « le Client »).
                </p>
                <p className="text-muted-foreground mt-4">
                  Toute souscription aux services de Linea Suite implique l'acceptation sans 
                  réserve des présentes CGV. Linea Suite se réserve le droit de modifier les 
                  présentes CGV à tout moment, les nouvelles conditions étant applicables dès 
                  leur mise en ligne sur le site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description des services</h2>
                <p className="text-muted-foreground mb-4">
                  Linea Suite propose une plateforme SaaS (Software as a Service) de gestion 
                  pour agences d'architecture comprenant les modules suivants :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Gestion de projets</strong> : suivi des phases, livrables, dépendances et plannings</li>
                  <li><strong>CRM intégré</strong> : gestion des contacts, opportunités et pipeline commercial</li>
                  <li><strong>Devis et facturation</strong> : création de propositions commerciales et suivi des paiements</li>
                  <li><strong>Appels d'offres</strong> : analyse automatisée des DCE et assistance à la rédaction</li>
                  <li><strong>Planning chantier</strong> : coordination des intervenants et comptes-rendus</li>
                  <li><strong>Collaboration</strong> : espaces de travail partagés et notifications temps réel</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Les fonctionnalités disponibles varient selon la formule d'abonnement souscrite 
                  par le Client, telle que décrite sur la page tarifaire du site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Tarification et formules</h2>
                <p className="text-muted-foreground mb-4">
                  Les prix sont indiqués en euros hors taxes (HT). La TVA applicable sera ajoutée 
                  au moment de la facturation. Trois formules sont proposées :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Starter (Gratuit)</strong> : limité à 1 utilisateur et 3 projets actifs, accès aux fonctionnalités de base</li>
                  <li><strong>Pro</strong> : 49€ HT/mois en facturation mensuelle ou 39€ HT/mois en facturation annuelle, utilisateurs et projets illimités, accès à tous les modules dont l'IA</li>
                  <li><strong>Enterprise</strong> : tarification sur devis selon les besoins spécifiques, incluant SSO, API dédiée et support premium</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Linea Suite se réserve le droit de modifier ses tarifs à tout moment. Toute 
                  modification sera notifiée au Client au moins 30 jours avant son entrée en 
                  vigueur et ne s'appliquera qu'au renouvellement de l'abonnement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Modalités de paiement</h2>
                <p className="text-muted-foreground mb-4">
                  Le paiement s'effectue par carte bancaire via notre prestataire de paiement 
                  sécurisé Stripe. Les moyens de paiement acceptés sont :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Cartes bancaires Visa, Mastercard, American Express</li>
                  <li>Prélèvement SEPA (pour les abonnements annuels Enterprise)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  La facturation est automatique et intervient en début de période (mensuelle ou 
                  annuelle selon l'option choisie). Les factures sont disponibles dans l'espace 
                  client et envoyées par email à l'adresse de facturation renseignée.
                </p>
                <p className="text-muted-foreground mt-4">
                  En cas de retard de paiement, des pénalités de retard seront appliquées au taux 
                  annuel de 10% à compter de la date d'échéance, sans qu'un rappel soit nécessaire. 
                  Une indemnité forfaitaire de 40 euros pour frais de recouvrement sera également 
                  due conformément à l'article L.441-10 du Code de commerce.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Droit de rétractation</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément à l'article L.221-18 du Code de la consommation, le Client 
                  consommateur dispose d'un délai de 14 jours à compter de la souscription 
                  pour exercer son droit de rétractation, sans avoir à justifier de motifs 
                  ni à payer de pénalités.
                </p>
                <p className="text-muted-foreground">
                  Pour exercer ce droit, le Client doit notifier sa décision par email à 
                  l'adresse support@lineasuite.com ou via le formulaire de contact disponible 
                  sur le site. Le remboursement sera effectué dans un délai de 14 jours suivant 
                  la réception de la demande, en utilisant le même moyen de paiement que celui 
                  utilisé pour la transaction initiale.
                </p>
                <p className="text-muted-foreground mt-4">
                  Toutefois, conformément à l'article L.221-28 du Code de la consommation, le 
                  droit de rétractation ne peut être exercé pour les services pleinement exécutés 
                  avant la fin du délai de rétractation et dont l'exécution a commencé avec 
                  l'accord préalable exprès du consommateur.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Durée et résiliation</h2>
                <p className="text-muted-foreground mb-4">
                  L'abonnement est souscrit pour une durée indéterminée avec une période de 
                  facturation mensuelle ou annuelle selon l'option choisie par le Client.
                </p>
                <p className="text-muted-foreground">
                  Le Client peut résilier son abonnement à tout moment depuis son espace client, 
                  rubrique « Paramètres {">"} Abonnement ». La résiliation prend effet à la fin de 
                  la période de facturation en cours. Aucun remboursement au prorata ne sera 
                  effectué pour la période restante.
                </p>
                <p className="text-muted-foreground mt-4">
                  Linea Suite peut résilier l'abonnement du Client en cas de violation des 
                  présentes CGV, notamment en cas de non-paiement, d'utilisation frauduleuse 
                  ou contraire aux bonnes mœurs. La résiliation sera notifiée par email avec 
                  un préavis de 15 jours, sauf en cas de manquement grave justifiant une 
                  résiliation immédiate.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Renouvellement automatique</h2>
                <p className="text-muted-foreground">
                  L'abonnement est renouvelé automatiquement à chaque échéance sauf résiliation 
                  par le Client avant la date de renouvellement. Un email de rappel est envoyé 
                  7 jours avant le renouvellement indiquant le montant qui sera prélevé et la 
                  procédure de résiliation.
                </p>
                <p className="text-muted-foreground mt-4">
                  En cas de modification tarifaire, le Client sera informé au moins 30 jours 
                  avant la prise d'effet du nouveau tarif. Le Client pourra alors choisir de 
                  résilier son abonnement avant l'entrée en vigueur du nouveau tarif.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Propriété intellectuelle</h2>
                <p className="text-muted-foreground">
                  Linea Suite conserve l'intégralité des droits de propriété intellectuelle sur 
                  la plateforme, incluant le code source, l'interface, les algorithmes, les 
                  bases de données et la documentation. Le Client se voit accorder une licence 
                  d'utilisation non exclusive, non transférable, pour la durée de son abonnement.
                </p>
                <p className="text-muted-foreground mt-4">
                  Le Client conserve la propriété de ses données et contenus uploadés sur la 
                  plateforme. Il accorde à Linea Suite une licence limitée d'utilisation de 
                  ces données aux seules fins de fourniture du service.
                </p>
                <p className="text-muted-foreground mt-4">
                  Il est strictement interdit de reproduire, modifier, distribuer ou exploiter 
                  commercialement tout ou partie de la plateforme Linea Suite sans autorisation 
                  écrite préalable.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disponibilité et maintenance</h2>
                <p className="text-muted-foreground">
                  Linea Suite s'engage à fournir un service de qualité avec une disponibilité 
                  cible de 99,9% calculée sur une base mensuelle, hors périodes de maintenance 
                  programmée et cas de force majeure.
                </p>
                <p className="text-muted-foreground mt-4">
                  Les opérations de maintenance programmée seront notifiées au moins 48 heures 
                  à l'avance par email ou notification dans l'application. Les maintenances 
                  d'urgence (correction de failles de sécurité, bugs critiques) pourront être 
                  effectuées sans préavis.
                </p>
                <p className="text-muted-foreground mt-4">
                  En cas d'indisponibilité prolongée (plus de 24 heures consécutives hors 
                  maintenance programmée), le Client pourra demander un avoir calculé au 
                  prorata de la durée d'indisponibilité.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation de responsabilité</h2>
                <p className="text-muted-foreground">
                  Linea Suite s'engage à mettre en œuvre tous les moyens nécessaires pour 
                  assurer la qualité et la continuité du service. Sa responsabilité est 
                  toutefois limitée aux conditions suivantes :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>La responsabilité de Linea Suite est limitée aux dommages directs et prévisibles</li>
                  <li>Le montant total des dommages-intérêts ne pourra excéder le montant des sommes versées par le Client au cours des 12 mois précédant le fait générateur</li>
                  <li>Linea Suite ne saurait être tenue responsable des dommages indirects tels que perte de chiffre d'affaires, perte de données, perte de clientèle</li>
                  <li>Linea Suite n'est pas responsable des contenus créés, stockés ou partagés par le Client via la plateforme</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Force majeure</h2>
                <p className="text-muted-foreground">
                  Aucune des parties ne pourra être tenue responsable de l'inexécution de ses 
                  obligations en cas de force majeure au sens de l'article 1218 du Code civil, 
                  notamment : catastrophes naturelles, guerres, attentats, grèves, pannes 
                  d'électricité ou de télécommunications, attaques informatiques majeures, 
                  décisions gouvernementales.
                </p>
                <p className="text-muted-foreground mt-4">
                  La partie affectée par un cas de force majeure devra en informer l'autre 
                  partie dans les 48 heures suivant sa survenance. Si le cas de force majeure 
                  se prolonge au-delà de 30 jours, chaque partie pourra résilier le contrat 
                  sans indemnité.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Protection des données</h2>
                <p className="text-muted-foreground">
                  Linea Suite s'engage à protéger les données personnelles de ses Clients 
                  conformément au Règlement Général sur la Protection des Données (RGPD) et 
                  à la loi Informatique et Libertés. Les modalités de traitement des données 
                  sont détaillées dans notre Politique de Confidentialité accessible sur le site.
                </p>
                <p className="text-muted-foreground mt-4">
                  Pour les données professionnelles stockées par le Client via la plateforme, 
                  Linea Suite agit en qualité de sous-traitant au sens du RGPD. Un accord de 
                  traitement des données (DPA) est disponible sur demande pour les clients 
                  Enterprise.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Export des données</h2>
                <p className="text-muted-foreground">
                  Le Client peut exporter ses données à tout moment via les fonctionnalités 
                  d'export disponibles dans l'application. Les formats d'export disponibles 
                  incluent CSV, Excel et PDF selon les types de données.
                </p>
                <p className="text-muted-foreground mt-4">
                  En cas de résiliation, le Client dispose d'un délai de 30 jours pour exporter 
                  ses données. Passé ce délai, les données seront supprimées de manière 
                  définitive de nos serveurs.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Droit applicable et juridiction</h2>
                <p className="text-muted-foreground">
                  Les présentes CGV sont régies par le droit français. Tout litige relatif à 
                  leur interprétation ou à leur exécution sera soumis à la compétence exclusive 
                  des tribunaux de Paris, sauf disposition légale contraire applicable aux 
                  consommateurs.
                </p>
                <p className="text-muted-foreground mt-4">
                  Préalablement à toute action judiciaire, les parties s'engagent à rechercher 
                  une solution amiable dans un délai de 30 jours. Le Client consommateur peut 
                  également recourir à un médiateur de la consommation dont les coordonnées 
                  sont disponibles sur demande.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question relative aux présentes CGV ou à l'utilisation de la 
                  plateforme :<br /><br />
                  <strong>Linea Suite SAS</strong><br />
                  42 rue de l'Innovation<br />
                  75011 Paris, France<br /><br />
                  Email : legal@lineasuite.com<br />
                  Téléphone : +33 1 23 45 67 89<br />
                  Support : support@lineasuite.com
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
