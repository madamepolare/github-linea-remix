import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TopBarProvider } from "@/contexts/TopBarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { MainLayout } from "@/components/layout/MainLayout";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const CRM = lazy(() => import("./pages/CRM"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const ContactDetail = lazy(() => import("./pages/ContactDetail"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Commercial = lazy(() => import("./pages/Commercial"));
const CommercialDocument = lazy(() => import("./pages/CommercialDocument"));
const Tenders = lazy(() => import("./pages/Tenders"));
const TenderDetail = lazy(() => import("./pages/TenderDetail"));
const Documents = lazy(() => import("./pages/Documents"));
const Team = lazy(() => import("./pages/Team"));
const Chantier = lazy(() => import("./pages/Chantier"));
const Invoicing = lazy(() => import("./pages/Invoicing"));
const References = lazy(() => import("./pages/References"));
const ReferenceDetail = lazy(() => import("./pages/ReferenceDetail"));
const Materials = lazy(() => import("./pages/Materials"));
const Objects = lazy(() => import("./pages/Objects"));
const Welcome = lazy(() => import("./pages/Welcome"));
const ModuleDetail = lazy(() => import("./pages/ModuleDetail"));
const SolutionDetail = lazy(() => import("./pages/SolutionDetail"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Contact = lazy(() => import("./pages/Contact"));
const CGV = lazy(() => import("./pages/legal/CGV"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Legal = lazy(() => import("./pages/legal/Legal"));
const Workflow = lazy(() => import("./pages/Workflow"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const MediaPlanning = lazy(() => import("./pages/MediaPlanning"));
const CreateWorkspace = lazy(() => import("./pages/CreateWorkspace"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CommandPalette />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes (no layout) */}
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/modules/:slug" element={<ModuleDetail />} />
              <Route path="/solutions/:slug" element={<SolutionDetail />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal/cgv" element={<CGV />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/mentions" element={<Legal />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/invite" element={<AcceptInvite />} />
              <Route path="/settings/workspace/new" element={<CreateWorkspace />} />

              {/* Protected routes with shared MainLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <TopBarProvider>
                      <MainLayout />
                    </TopBarProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/crm/:section" element={<CRM />} />
                <Route path="/crm/companies/:id" element={<CompanyDetail />} />
                <Route path="/crm/contacts/:id" element={<ContactDetail />} />
                <Route path="/crm/leads/:id" element={<LeadDetail />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:view" element={<Tasks />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/list" element={<Projects />} />
                <Route path="/projects/board" element={<Projects />} />
                <Route path="/projects/timeline" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/commercial" element={<Commercial />} />
                <Route path="/commercial/all" element={<Commercial />} />
                <Route path="/commercial/quotes" element={<Commercial />} />
                <Route path="/commercial/contracts" element={<Commercial />} />
                <Route path="/commercial/proposals" element={<Commercial />} />
                <Route path="/commercial/:id" element={<CommercialDocument />} />
                <Route path="/invoicing" element={<Invoicing />} />
                <Route path="/invoicing/:filter" element={<Invoicing />} />
                <Route path="/tenders" element={<Tenders />} />
                <Route path="/tenders/kanban" element={<Tenders />} />
                <Route path="/tenders/list" element={<Tenders />} />
                <Route path="/tenders/:id" element={<TenderDetail />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/documents/:section" element={<Documents />} />
                <Route path="/team" element={<Team />} />
                <Route path="/team/:section" element={<Team />} />
                <Route path="/chantier" element={<Chantier />} />
                <Route path="/chantier/:projectId" element={<Chantier />} />
                <Route path="/chantier/:projectId/:section" element={<Chantier />} />
                <Route path="/references" element={<References />} />
                <Route path="/references/:id" element={<ReferenceDetail />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/objects" element={<Objects />} />
                <Route path="/planning" element={<Workflow />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/:id" element={<CampaignDetail />} />
                <Route path="/media-planning" element={<MediaPlanning />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
