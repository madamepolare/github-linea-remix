import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  FolderPlus,
  BookOpen,
  FileText,
  Users,
  Briefcase,
  CheckSquare,
  Wrench,
  LayoutGrid,
  List,
  ChevronRight,
  Sparkles,
  Tag,
  Clock,
  Eye,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDocumentationCategories,
  useDocumentationPages,
  DOCUMENTATION_TAGS,
  DOCUMENTATION_PAGE_TYPES,
} from "@/hooks/useDocumentation";
import { DocumentationSidebar } from "@/components/documentation/DocumentationSidebar";
import { DocumentationPageCard } from "@/components/documentation/DocumentationPageCard";
import { CreateCategoryDialog } from "@/components/documentation/CreateCategoryDialog";
import { CreatePageDialog } from "@/components/documentation/CreatePageDialog";
import { AISetupDialog } from "@/components/documentation/AISetupDialog";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  agency: Briefcase,
  projects: FolderPlus,
  roles: Users,
  checklists: CheckSquare,
  tools: Wrench,
};

export default function Documentation() {
  const { navigate } = useWorkspaceNavigation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showAISetup, setShowAISetup] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    searchParams.get("category")
  );

  const { categories, isLoading: categoriesLoading } = useDocumentationCategories();
  const { pages, isLoading: pagesLoading } = useDocumentationPages(selectedCategoryId || undefined);

  const isLoading = categoriesLoading || pagesLoading;

  // Filter pages based on search
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const query = searchQuery.toLowerCase();
    return pages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.content?.toLowerCase().includes(query) ||
        page.objective?.toLowerCase().includes(query) ||
        page.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [pages, searchQuery]);

  // Group pages by category for overview
  const pagesByCategory = useMemo(() => {
    const grouped: Record<string, typeof pages> = {};
    pages.forEach((page) => {
      const catId = page.category_id || "uncategorized";
      if (!grouped[catId]) grouped[catId] = [];
      grouped[catId].push(page);
    });
    return grouped;
  }, [pages]);

  // Stats
  const stats = useMemo(() => {
    return {
      totalPages: pages.length,
      totalCategories: categories.length,
      totalViews: pages.reduce((acc, p) => acc + (p.view_count || 0), 0),
      recentPages: pages
        .filter((p) => p.updated_at)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 5),
    };
  }, [pages, categories]);

  const handlePageClick = (pageId: string) => {
    navigate(`/documentation/${pageId}`);
  };

  if (isLoading) {
    return (
      <PageLayout
        title="Documentation"
        description="Base de connaissances interne de l'agence"
      >
        <div className="flex gap-6">
          <div className="w-64 shrink-0">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <PageLayout
        title="Documentation"
        description="Base de connaissances interne de l'agence"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <BookOpen className="h-12 w-12 text-primary" strokeWidth={THIN_STROKE} />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Bienvenue dans votre Documentation
          </h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Centralisez tous les processus, bonnes pratiques et protocoles de votre agence.
            Commencez par générer une documentation adaptée à votre discipline avec l'IA.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setShowAISetup(true)} size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Générer avec l'IA
            </Button>
            <Button variant="outline" size="lg" onClick={() => setShowCreateCategory(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Créer manuellement
            </Button>
          </div>
        </motion.div>

        <AISetupDialog open={showAISetup} onOpenChange={setShowAISetup} />
        <CreateCategoryDialog open={showCreateCategory} onOpenChange={setShowCreateCategory} />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Documentation"
      description="Base de connaissances interne de l'agence"
      primaryAction={{
        label: "Nouvelle page",
        onClick: () => setShowCreatePage(true),
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-64 shrink-0">
          <DocumentationSidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCreateCategory={() => setShowCreateCategory(true)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {/* Mobile category selector */}
              <select
                className="lg:hidden h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {!selectedCategoryId && !searchQuery && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{stats.totalPages}</p>
                      <p className="text-xs text-muted-foreground">Pages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-info/10 p-2">
                      <FolderPlus className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{stats.totalCategories}</p>
                      <p className="text-xs text-muted-foreground">Catégories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-success/10 p-2">
                      <Eye className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{stats.totalViews}</p>
                      <p className="text-xs text-muted-foreground">Vues totales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-warning/10 p-2">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{stats.recentPages.length}</p>
                      <p className="text-xs text-muted-foreground">Récentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {DOCUMENTATION_TAGS.map((tag) => (
              <Badge
                key={tag.value}
                variant="secondary"
                className={cn("cursor-pointer hover:opacity-80", tag.color)}
                onClick={() => setSearchQuery(tag.value)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag.label}
              </Badge>
            ))}
          </div>

          {/* Pages Grid/List */}
          {filteredPages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune page trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Essayez avec d'autres termes de recherche"
                  : "Créez votre première page de documentation"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreatePage(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une page
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPages.map((page) => (
                <DocumentationPageCard
                  key={page.id}
                  page={page}
                  onClick={() => handlePageClick(page.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPages.map((page) => (
                <Card
                  key={page.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handlePageClick(page.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className="text-2xl">{page.emoji || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{page.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {page.objective || page.content?.slice(0, 100)}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {page.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateCategoryDialog open={showCreateCategory} onOpenChange={setShowCreateCategory} />
      <CreatePageDialog
        open={showCreatePage}
        onOpenChange={setShowCreatePage}
        defaultCategoryId={selectedCategoryId}
      />
      <AISetupDialog open={showAISetup} onOpenChange={setShowAISetup} />
    </PageLayout>
  );
}
