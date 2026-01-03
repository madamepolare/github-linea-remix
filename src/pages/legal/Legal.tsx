import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function Legal() {
  return (
    <>
      <SEOHead
        title="Mentions Légales | Linea Suite"
        description="Mentions légales de Linea Suite - Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du site."
        keywords="mentions légales, éditeur, hébergeur, Linea Suite, conditions utilisation"
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        <main className="pt-32 pb-24 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Mentions Légales
            </h1>

            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Éditeur du site</h2>
                <p className="text-muted-foreground">
                  <strong>Linea Suite SAS</strong><br />
                  Société par Actions Simplifiée au capital de 10 000 €<br />
                  RCS Paris B 123 456 789<br />
                  SIRET : 123 456 789 00012<br />
                  Code APE : 6201Z - Programmation informatique<br />
                  TVA intracommunautaire : FR12 123456789<br /><br />
                  <strong>Siège social :</strong><br />
                  42 rue de l'Innovation<br />
                  75011 Paris, France<br /><br />
                  <strong>Contact :</strong><br />
                  Téléphone : +33 1 23 45 67 89<br />
                  Email : contact@lineasuite.com<br />
                  Site web : www.lineasuite.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Directeur de la publication</h2>
                <p className="text-muted-foreground">
                  Marie Laurent, Présidente de Linea Suite SAS<br />
                  Email : direction@lineasuite.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Hébergement</h2>
                <p className="text-muted-foreground">
                  Le site lineasuite.com et la plateforme associée sont hébergés par :<br /><br />
                  <strong>Supabase Inc.</strong><br />
                  970 Toa Payoh North #07-04<br />
                  Singapour 318992<br />
                  Site web : www.supabase.com<br /><br />
                  <strong>Infrastructure cloud :</strong><br />
                  Amazon Web Services (AWS)<br />
                  Serveurs localisés en Europe (Francfort, Allemagne)<br />
                  Conformité RGPD et certifications ISO 27001, SOC 2
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Conditions d'utilisation du site</h2>
                <p className="text-muted-foreground mb-4">
                  L'accès et l'utilisation du site lineasuite.com sont soumis aux présentes 
                  mentions légales ainsi qu'aux lois et réglementations applicables. En accédant 
                  au site, vous acceptez ces conditions sans réserve.
                </p>
                <p className="text-muted-foreground">
                  Le site est accessible gratuitement à tout utilisateur disposant d'un accès 
                  à Internet. Tous les coûts liés à l'accès au site (matériel, logiciels, 
                  abonnement Internet) sont à la charge de l'utilisateur.
                </p>
                <p className="text-muted-foreground mt-4">
                  L'utilisation de la plateforme Linea Suite (au-delà de la simple consultation 
                  du site vitrine) nécessite la création d'un compte et l'acceptation des 
                  Conditions Générales de Vente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Propriété intellectuelle</h2>
                <p className="text-muted-foreground">
                  L'ensemble du contenu du site lineasuite.com est protégé par les lois 
                  françaises et internationales relatives à la propriété intellectuelle. 
                  Cela inclut notamment :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Les textes, articles et contenus rédactionnels</li>
                  <li>Les photographies, illustrations et éléments graphiques</li>
                  <li>Le logo et l'identité visuelle Linea Suite</li>
                  <li>L'architecture et le design du site</li>
                  <li>Le code source et les logiciels</li>
                  <li>Les bases de données</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Toute reproduction, représentation, modification, publication, transmission, 
                  dénaturation ou exploitation commerciale, totale ou partielle, du contenu 
                  du site, par quelque procédé que ce soit et sur quelque support que ce soit, 
                  est interdite sans l'autorisation écrite préalable de Linea Suite SAS.
                </p>
                <p className="text-muted-foreground mt-4">
                  Toute exploitation non autorisée du site ou de son contenu serait considérée 
                  comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions 
                  des articles L.335-2 et suivants du Code de la propriété intellectuelle.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Marques</h2>
                <p className="text-muted-foreground">
                  « Linea Suite » et le logo associé sont des marques déposées de Linea Suite SAS. 
                  Toute utilisation, reproduction ou représentation de ces marques, de quelque 
                  manière que ce soit et à quelque titre que ce soit, est interdite sans 
                  autorisation préalable.
                </p>
                <p className="text-muted-foreground mt-4">
                  Les autres marques, logos et noms de produits mentionnés sur ce site 
                  appartiennent à leurs propriétaires respectifs.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Limitation de responsabilité</h2>
                <p className="text-muted-foreground mb-4">
                  Linea Suite s'efforce de fournir des informations aussi exactes que possible 
                  sur son site. Toutefois, elle ne peut garantir l'exactitude, la complétude 
                  ou l'actualité des informations diffusées.
                </p>
                <p className="text-muted-foreground">
                  En conséquence, Linea Suite décline toute responsabilité :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site</li>
                  <li>Pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations</li>
                  <li>Pour toute interruption ou indisponibilité du site</li>
                  <li>Pour tout dommage direct ou indirect résultant de l'utilisation du site</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Liens hypertextes</h2>
                <p className="text-muted-foreground mb-4">
                  <strong>Liens sortants :</strong><br />
                  Le site peut contenir des liens vers d'autres sites internet. Linea Suite 
                  n'exerce aucun contrôle sur ces sites et n'assume aucune responsabilité quant 
                  à leur contenu, leur disponibilité ou les pratiques de leurs éditeurs en 
                  matière de protection des données personnelles.
                </p>
                <p className="text-muted-foreground">
                  <strong>Liens entrants :</strong><br />
                  La création de liens hypertextes vers le site lineasuite.com est autorisée 
                  sans déclaration préalable, à condition que :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                  <li>Les pages du site ne soient pas imbriquées dans les pages d'un autre site (pas de framing)</li>
                  <li>La source soit clairement identifiable</li>
                  <li>Le lien ne porte pas atteinte à l'image de Linea Suite</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Linea Suite se réserve le droit de demander la suppression d'un lien qu'elle 
                  estime non conforme à ces conditions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Protection des contenus</h2>
                <p className="text-muted-foreground">
                  L'utilisateur s'engage à ne pas :
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Utiliser des robots, spiders ou autres outils automatiques pour extraire le contenu du site</li>
                  <li>Contourner les mesures techniques de protection mises en place</li>
                  <li>Reproduire ou copier le contenu à des fins commerciales</li>
                  <li>Modifier, adapter ou traduire le contenu sans autorisation</li>
                  <li>Utiliser le contenu d'une manière qui porterait atteinte aux droits de Linea Suite ou de tiers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies</h2>
                <p className="text-muted-foreground">
                  Le site utilise des cookies pour améliorer l'expérience utilisateur et 
                  analyser le trafic. Pour plus d'informations sur l'utilisation des cookies 
                  et la gestion de vos préférences, veuillez consulter notre Politique de 
                  Confidentialité.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Protection des données personnelles</h2>
                <p className="text-muted-foreground">
                  Conformément au Règlement Général sur la Protection des Données (RGPD) et 
                  à la loi Informatique et Libertés, vous disposez de droits sur vos données 
                  personnelles. Pour en savoir plus, consultez notre Politique de Confidentialité.
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Délégué à la Protection des Données :</strong><br />
                  Email : dpo@lineasuite.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Médiation des litiges</h2>
                <p className="text-muted-foreground">
                  Conformément aux dispositions du Code de la consommation concernant le 
                  règlement amiable des litiges, le consommateur a le droit de recourir 
                  gratuitement au service de médiation proposé par Linea Suite.
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>Médiateur de la consommation :</strong><br />
                  Centre de Médiation de la Consommation des Conciliateurs de Justice (CM2C)<br />
                  14 rue Saint Jean - 75017 Paris<br />
                  Site web : www.cm2c.net<br /><br />
                  Le médiateur peut également être saisi directement via : mediation@lineasuite.com
                </p>
                <p className="text-muted-foreground mt-4">
                  Avant de saisir le médiateur, le consommateur doit avoir tenté de résoudre 
                  son litige directement auprès du service client de Linea Suite par une 
                  réclamation écrite.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Droit applicable</h2>
                <p className="text-muted-foreground">
                  Les présentes mentions légales sont régies par le droit français. Tout 
                  litige relatif à l'utilisation du site sera soumis à la compétence exclusive 
                  des tribunaux français, sauf dispositions légales contraires applicables 
                  aux consommateurs.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Crédits</h2>
                <p className="text-muted-foreground">
                  <strong>Conception et développement :</strong><br />
                  Équipe Linea Suite<br /><br />
                  <strong>Design graphique :</strong><br />
                  Équipe Linea Suite<br /><br />
                  <strong>Icônes :</strong><br />
                  Lucide Icons (https://lucide.dev) - Licence MIT<br /><br />
                  <strong>Typographie :</strong><br />
                  Inter (Google Fonts) - Licence OFL<br /><br />
                  <strong>Illustrations :</strong><br />
                  Créations originales Linea Suite
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">15. Mise à jour</h2>
                <p className="text-muted-foreground">
                  Les présentes mentions légales peuvent être modifiées à tout moment. 
                  La date de dernière mise à jour est : 1er janvier 2026.
                </p>
                <p className="text-muted-foreground mt-4">
                  Il est conseillé à l'utilisateur de consulter régulièrement cette page 
                  pour prendre connaissance des éventuelles modifications.
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
