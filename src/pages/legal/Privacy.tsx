import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="Politique de Confidentialité | Linea Suite"
        description="Découvrez comment Linea Suite protège vos données personnelles et respecte votre vie privée conformément au RGPD."
        keywords="politique confidentialité, RGPD, données personnelles, vie privée, Linea Suite"
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
                  Linea Suite SAS (« nous », « notre », « nos ») s'engage à protéger la vie 
                  privée de ses utilisateurs (« vous », « votre », « vos »). Cette politique 
                  de confidentialité explique comment nous collectons, utilisons, stockons et 
                  protégeons vos données personnelles conformément au Règlement Général sur 
                  la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                </p>
                <p className="text-muted-foreground mt-4">
                  En utilisant nos services, vous acceptez les pratiques décrites dans la 
                  présente politique. Si vous n'acceptez pas cette politique, veuillez ne 
                  pas utiliser nos services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Responsable du traitement</h2>
                <p className="text-muted-foreground">
                  Le responsable du traitement de vos données personnelles est :<br /><br />
                  <strong>Linea Suite SAS</strong><br />
                  42 rue de l'Innovation<br />
                  75011 Paris, France<br />
                  Email : dpo@lineasuite.com<br />
                  Téléphone : +33 1 23 45 67 89
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Données collectées</h2>
                <p className="text-muted-foreground mb-4">
                  Nous collectons différentes catégories de données selon votre utilisation 
                  de nos services :
                </p>
                
                <h3 className="text-xl font-medium text-foreground mb-2 mt-6">3.1 Données d'identification</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Nom et prénom</li>
                  <li>Adresse email professionnelle</li>
                  <li>Numéro de téléphone</li>
                  <li>Photo de profil (optionnel)</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-2 mt-6">3.2 Données professionnelles</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Nom de l'agence ou entreprise</li>
                  <li>Fonction/poste occupé</li>
                  <li>Numéro SIRET (pour la facturation)</li>
                  <li>Adresse professionnelle</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-2 mt-6">3.3 Données d'utilisation</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Historique de connexion (dates, heures, adresses IP)</li>
                  <li>Actions effectuées dans l'application</li>
                  <li>Préférences et paramètres utilisateur</li>
                  <li>Données de navigation (pages visitées, durée des sessions)</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-2 mt-6">3.4 Données de facturation</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Adresse de facturation</li>
                  <li>Historique des paiements</li>
                  <li>Les données de carte bancaire sont traitées directement par Stripe et ne sont pas stockées par Linea Suite</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-2 mt-6">3.5 Données techniques</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Type de navigateur et version</li>
                  <li>Système d'exploitation</li>
                  <li>Résolution d'écran</li>
                  <li>Identifiants de cookies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Base légale du traitement</h2>
                <p className="text-muted-foreground mb-4">
                  Nous traitons vos données personnelles sur les bases légales suivantes :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Exécution du contrat</strong> : pour fournir nos services, gérer votre compte et traiter vos paiements</li>
                  <li><strong>Intérêt légitime</strong> : pour améliorer nos services, assurer la sécurité et prévenir la fraude</li>
                  <li><strong>Consentement</strong> : pour l'envoi de communications marketing et l'utilisation de cookies non essentiels</li>
                  <li><strong>Obligation légale</strong> : pour respecter nos obligations comptables et fiscales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Finalités du traitement</h2>
                <p className="text-muted-foreground mb-4">
                  Vos données sont utilisées pour :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Créer et gérer votre compte utilisateur</li>
                  <li>Fournir, maintenir et améliorer nos services</li>
                  <li>Traiter vos paiements et gérer la facturation</li>
                  <li>Vous envoyer des communications liées au service (confirmations, alertes, mises à jour)</li>
                  <li>Assurer le support client et répondre à vos demandes</li>
                  <li>Analyser l'utilisation du service pour l'améliorer</li>
                  <li>Détecter et prévenir les activités frauduleuses</li>
                  <li>Respecter nos obligations légales et réglementaires</li>
                  <li>Avec votre consentement, vous envoyer des communications marketing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Partage des données</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Nous ne vendons jamais vos données personnelles.</strong> Vos données 
                  peuvent être partagées avec les catégories de destinataires suivantes :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Prestataires techniques</strong> : hébergement (Supabase/AWS), paiement (Stripe), email (SendGrid), analytics (Mixpanel)</li>
                  <li><strong>Partenaires métier</strong> : uniquement si nécessaire pour fournir un service spécifique et avec votre consentement</li>
                  <li><strong>Autorités</strong> : en cas d'obligation légale ou de réquisition judiciaire</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Tous nos sous-traitants sont soumis à des accords de traitement des données 
                  (DPA) garantissant un niveau de protection conforme au RGPD.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Transferts internationaux</h2>
                <p className="text-muted-foreground">
                  Nos serveurs principaux sont hébergés en Europe (Francfort, Allemagne). 
                  Certains de nos sous-traitants peuvent traiter des données en dehors de 
                  l'Espace Économique Européen (EEE), notamment aux États-Unis.
                </p>
                <p className="text-muted-foreground mt-4">
                  Dans ce cas, nous nous assurons que des garanties appropriées sont en place :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                  <li>Clauses Contractuelles Types de la Commission Européenne</li>
                  <li>Certification au Data Privacy Framework (pour les transferts vers les USA)</li>
                  <li>Mesures supplémentaires de sécurité (chiffrement, pseudonymisation)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Durée de conservation</h2>
                <p className="text-muted-foreground mb-4">
                  Nous conservons vos données uniquement le temps nécessaire aux finalités 
                  pour lesquelles elles ont été collectées :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Données de compte</strong> : pendant la durée de l'abonnement + 3 ans après résiliation</li>
                  <li><strong>Données de facturation</strong> : 10 ans (obligation légale comptable)</li>
                  <li><strong>Données d'utilisation</strong> : 2 ans à compter de la collecte</li>
                  <li><strong>Logs de connexion</strong> : 1 an (obligation LCEN)</li>
                  <li><strong>Données de support</strong> : 3 ans après clôture du ticket</li>
                  <li><strong>Cookies</strong> : 13 mois maximum</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  À l'expiration de ces durées, vos données sont supprimées ou anonymisées 
                  de manière irréversible.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Sécurité des données</h2>
                <p className="text-muted-foreground mb-4">
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                  appropriées pour protéger vos données :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256)</li>
                  <li>Authentification à deux facteurs disponible</li>
                  <li>Gestion des accès basée sur les rôles (RBAC)</li>
                  <li>Sauvegardes quotidiennes avec réplication géographique</li>
                  <li>Surveillance 24/7 et détection d'intrusion</li>
                  <li>Tests de pénétration réguliers</li>
                  <li>Formation du personnel à la protection des données</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Vos droits</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément au RGPD, vous disposez des droits suivants sur vos données 
                  personnelles :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification</strong> : corriger des données inexactes ou incomplètes</li>
                  <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
                  <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition</strong> : vous opposer au traitement pour motif légitime</li>
                  <li><strong>Droit de limitation</strong> : limiter le traitement dans certains cas</li>
                  <li><strong>Droit de retrait du consentement</strong> : à tout moment pour les traitements basés sur le consentement</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Pour exercer ces droits, contactez-nous à dpo@lineasuite.com. Nous répondrons 
                  dans un délai d'un mois, prolongeable de deux mois en cas de demande complexe.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Profilage et décisions automatisées</h2>
                <p className="text-muted-foreground">
                  Nous n'effectuons pas de profilage ni de prise de décision entièrement 
                  automatisée ayant des effets juridiques ou significatifs sur vous.
                </p>
                <p className="text-muted-foreground mt-4">
                  Notre système de scoring des opportunités commerciales (dans le module CRM) 
                  utilise des algorithmes pour suggérer des priorités, mais toutes les 
                  décisions finales restent sous contrôle humain.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Cookies et traceurs</h2>
                <p className="text-muted-foreground mb-4">
                  Nous utilisons différentes catégories de cookies :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site (authentification, sécurité)</li>
                  <li><strong>Cookies fonctionnels</strong> : pour mémoriser vos préférences</li>
                  <li><strong>Cookies analytiques</strong> : pour comprendre l'utilisation du service (avec anonymisation IP)</li>
                  <li><strong>Cookies marketing</strong> : pour personnaliser les publicités (uniquement avec votre consentement)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Vous pouvez gérer vos préférences de cookies via la bannière affichée lors 
                  de votre première visite ou dans les paramètres de votre navigateur.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Modifications de la politique</h2>
                <p className="text-muted-foreground">
                  Nous pouvons mettre à jour cette politique de confidentialité pour refléter 
                  des changements dans nos pratiques ou pour des raisons légales. La date de 
                  dernière mise à jour est indiquée en haut de cette page.
                </p>
                <p className="text-muted-foreground mt-4">
                  En cas de modification substantielle, nous vous informerons par email ou 
                  par notification dans l'application au moins 30 jours avant l'entrée en 
                  vigueur des changements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Réclamation auprès de la CNIL</h2>
                <p className="text-muted-foreground">
                  Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser 
                  une réclamation à la Commission Nationale de l'Informatique et des Libertés 
                  (CNIL) :<br /><br />
                  CNIL<br />
                  3 Place de Fontenoy<br />
                  TSA 80715<br />
                  75334 Paris Cedex 07<br />
                  Site web : www.cnil.fr
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contact DPO</h2>
                <p className="text-muted-foreground">
                  Pour toute question relative à la protection de vos données ou pour exercer 
                  vos droits :<br /><br />
                  <strong>Délégué à la Protection des Données</strong><br />
                  Linea Suite SAS<br />
                  42 rue de l'Innovation<br />
                  75011 Paris, France<br /><br />
                  Email : dpo@lineasuite.com<br />
                  Téléphone : +33 1 23 45 67 89
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
