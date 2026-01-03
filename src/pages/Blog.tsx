import { Link } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Comment optimiser la gestion de vos phases de projet",
    excerpt: "Découvrez les meilleures pratiques pour structurer vos phases ESQ, APS, APD et DCE de manière efficace.",
    category: "Conseils",
    date: "15 Déc 2025",
    readTime: "5 min",
    featured: true,
  },
  {
    id: "2",
    title: "L'IA au service des appels d'offres en architecture",
    excerpt: "Comment l'intelligence artificielle peut vous aider à analyser les DCE et préparer vos réponses plus rapidement.",
    category: "Produit",
    date: "10 Déc 2025",
    readTime: "7 min",
  },
  {
    id: "3",
    title: "5 erreurs à éviter dans vos comptes-rendus de chantier",
    excerpt: "Les pièges courants lors de la rédaction de CR et comment les éviter pour protéger votre responsabilité.",
    category: "Architecture",
    date: "5 Déc 2025",
    readTime: "4 min",
  },
  {
    id: "4",
    title: "Nouveautés Linea Suite : bilan de l'année 2025",
    excerpt: "Retour sur les fonctionnalités majeures lancées cette année et aperçu de ce qui vous attend en 2026.",
    category: "Produit",
    date: "1 Déc 2025",
    readTime: "6 min",
  },
  {
    id: "5",
    title: "Digitaliser son agence : par où commencer ?",
    excerpt: "Guide pratique pour les agences d'architecture qui souhaitent moderniser leurs processus de travail.",
    category: "Conseils",
    date: "25 Nov 2025",
    readTime: "8 min",
  },
  {
    id: "6",
    title: "Interview : Studio Archi+ partage son expérience",
    excerpt: "Comment cette agence parisienne a transformé sa gestion de projets avec Linea Suite.",
    category: "Témoignage",
    date: "20 Nov 2025",
    readTime: "5 min",
  },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case "Produit":
      return "bg-primary/10 text-primary border-primary/20";
    case "Conseils":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "Architecture":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    case "Témoignage":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function Blog() {
  const featuredPost = blogPosts.find((p) => p.featured);
  const regularPosts = blogPosts.filter((p) => !p.featured);

  return (
    <>
      <SEOHead
        title="Blog | Linea Suite - Actualités et conseils pour architectes"
        description="Découvrez nos articles sur la gestion de projets d'architecture, les nouvelles fonctionnalités de Linea Suite et les meilleures pratiques du métier."
        keywords="blog, architecture, gestion projet, conseils, Linea Suite"
      />

      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <section className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Blog Linea Suite
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Actualités produit, conseils pratiques et retours d'expérience pour 
              les agences d'architecture modernes.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="pb-16 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="group relative p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
                <Badge className={getCategoryColor(featuredPost.category)}>
                  {featuredPost.category}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-4 mb-4 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {featuredPost.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {featuredPost.readTime}
                  </div>
                </div>
                <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="text-primary-foreground" size={18} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="pb-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <article
                  key={post.id}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <Badge className={getCategoryColor(post.category)}>
                    {post.category}
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground mt-4 mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
