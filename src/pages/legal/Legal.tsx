import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function Legal() {
  return (
    <>
      <SEOHead
        title="Mentions Légales | Linea Suite"
        description="Mentions légales de Linea Suite - Informations sur l'éditeur et l'hébergeur du site."
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
                <h2 className="text-2xl font-semibold text-foreground mb-4">Éditeur du site</h2>
                <p className="text-muted-foreground">
                  <strong>Linea Suite SAS</strong><br />
                  Société par Actions Simplifiée au capital de 10 000 €<br />
                  RCS Paris B 123 456 789<br />
                  SIRET : 123 456 789 00012<br />
                  TVA intracommunautaire : FR12 123456789<br /><br />
                  Siège social :<br />
                  42 rue de l'Innovation<br />
                  75011 Paris, France<br /><br />
                  Téléphone : +33 1 23 45 67 89<br />
                  Email : contact@lineasuite.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Directeur de la publication</h2>
                <p className="text-muted-foreground">
                  Marie Laurent, Présidente de Linea Suite SAS
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Hébergement</h2>
                <p className="text-muted-foreground">
                  Le site lineasuite.com est hébergé par :<br /><br />
                  <strong>Supabase Inc.</strong><br />
                  970 Toa Payoh North #07-04<br />
                  Singapour 318992<br /><br />
                  Infrastructure cloud sécurisée avec serveurs localisés en Europe (Francfort, Allemagne).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Propriété intellectuelle</h2>
                <p className="text-muted-foreground">
                  L'ensemble du contenu du site lineasuite.com (textes, images, logos, icônes, 
                  logiciels, etc.) est la propriété exclusive de Linea Suite SAS ou de ses 
                  partenaires et est protégé par les lois françaises et internationales 
                  relatives à la propriété intellectuelle.
                </p>
                <p className="text-muted-foreground mt-4">
                  Toute reproduction, représentation, modification, publication ou adaptation 
                  de tout ou partie des éléments du site, quel que soit le moyen ou le procédé 
                  utilisé, est interdite sans l'autorisation écrite préalable de Linea Suite SAS.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Crédits</h2>
                <p className="text-muted-foreground">
                  Design et développement : Équipe Linea Suite<br />
                  Icônes : Lucide Icons<br />
                  Typographie : Inter (Google Fonts)
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Médiation</h2>
                <p className="text-muted-foreground">
                  Conformément aux dispositions du Code de la consommation concernant le 
                  règlement amiable des litiges, le client peut recourir au service de 
                  médiation proposé par Linea Suite. Le médiateur peut être saisi via 
                  l'adresse mediation@lineasuite.com.
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
