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
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const CRM = lazy(() => import("./pages/CRM"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const ContactDetail = lazy(() => import("./pages/ContactDetail"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Commercial = lazy(() => import("./pages/Commercial"));
const CommercialDocument = lazy(() => import("./pages/CommercialDocument"));
const QuoteBuilder = lazy(() => import("./pages/QuoteBuilder"));
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
const Documentation = lazy(() => import("./pages/Documentation"));
const DocumentationPage = lazy(() => import("./pages/DocumentationPage"));
const CreateWorkspace = lazy(() => import("./pages/CreateWorkspace"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const PublicQuote = lazy(() => import("./pages/PublicQuote"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
              <Routes>
              {/* Public routes (no layout) */}
                <Route path="/" element={<Suspense fallback={<PageLoader />}><Welcome /></Suspense>} />
                <Route path="/welcome" element={<Suspense fallback={<PageLoader />}><Welcome /></Suspense>} />
                <Route path="/modules/:slug" element={<Suspense fallback={<PageLoader />}><ModuleDetail /></Suspense>} />
                <Route path="/solutions/:slug" element={<Suspense fallback={<PageLoader />}><SolutionDetail /></Suspense>} />
                <Route path="/roadmap" element={<Suspense fallback={<PageLoader />}><Roadmap /></Suspense>} />
                <Route path="/about" element={<Suspense fallback={<PageLoader />}><About /></Suspense>} />
                <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
                <Route path="/contact" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
                <Route path="/legal/cgv" element={<Suspense fallback={<PageLoader />}><CGV /></Suspense>} />
                <Route path="/legal/privacy" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
                <Route path="/legal/mentions" element={<Suspense fallback={<PageLoader />}><Legal /></Suspense>} />
              <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
              <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><Onboarding /></Suspense>} />
              <Route path="/invite" element={<Suspense fallback={<PageLoader />}><AcceptInvite /></Suspense>} />
              <Route path="/q/:token" element={<Suspense fallback={<PageLoader />}><PublicQuote /></Suspense>} />
              <Route path="/portal/:token" element={<Suspense fallback={<PageLoader />}><ClientPortal /></Suspense>} />

                {/* Protected routes with shared MainLayout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <TopBarProvider>
                        <CommandPalette />
                        <MainLayout />
                      </TopBarProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                  <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
                  <Route path="/crm" element={<Suspense fallback={<PageLoader />}><CRM /></Suspense>} />
                  <Route path="/crm/:section" element={<Suspense fallback={<PageLoader />}><CRM /></Suspense>} />
                  <Route path="/crm/companies/:id" element={<Suspense fallback={<PageLoader />}><CompanyDetail /></Suspense>} />
                  <Route path="/crm/contacts/:id" element={<Suspense fallback={<PageLoader />}><ContactDetail /></Suspense>} />
                  <Route path="/crm/leads/:id" element={<Suspense fallback={<PageLoader />}><LeadDetail /></Suspense>} />
                  <Route path="/tasks" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
                  <Route path="/tasks/view/:view" element={<Suspense fallback={<PageLoader />}><Tasks /></Suspense>} />
                  <Route path="/tasks/:taskId" element={<Suspense fallback={<PageLoader />}><TaskDetail /></Suspense>} />
                  <Route path="/projects" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
                  <Route path="/projects/list" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
                  <Route path="/projects/board" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
                  <Route path="/projects/timeline" element={<Suspense fallback={<PageLoader />}><Projects /></Suspense>} />
                  <Route path="/projects/:id" element={<Suspense fallback={<PageLoader />}><ProjectDetail /></Suspense>} />
                  <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
                  <Route path="/settings/workspace/new" element={<Suspense fallback={<PageLoader />}><CreateWorkspace /></Suspense>} />
                  <Route path="/commercial" element={<Suspense fallback={<PageLoader />}><Commercial /></Suspense>} />
                  <Route path="/commercial/all" element={<Suspense fallback={<PageLoader />}><Commercial /></Suspense>} />
                  <Route path="/commercial/quotes" element={<Suspense fallback={<PageLoader />}><Commercial /></Suspense>} />
                  <Route path="/commercial/contracts" element={<Suspense fallback={<PageLoader />}><Commercial /></Suspense>} />
                  
                  <Route path="/commercial/:id" element={<Suspense fallback={<PageLoader />}><CommercialDocument /></Suspense>} />
                  <Route path="/commercial/quote/new" element={<Suspense fallback={<PageLoader />}><QuoteBuilder /></Suspense>} />
                  <Route path="/commercial/quote/:id" element={<Suspense fallback={<PageLoader />}><QuoteBuilder /></Suspense>} />
                  <Route path="/invoicing" element={<Suspense fallback={<PageLoader />}><Invoicing /></Suspense>} />
                  <Route path="/invoicing/:filter" element={<Suspense fallback={<PageLoader />}><Invoicing /></Suspense>} />
                  <Route path="/tenders" element={<Suspense fallback={<PageLoader />}><Tenders /></Suspense>} />
                  <Route path="/tenders/kanban" element={<Suspense fallback={<PageLoader />}><Tenders /></Suspense>} />
                  <Route path="/tenders/list" element={<Suspense fallback={<PageLoader />}><Tenders /></Suspense>} />
                  <Route path="/tenders/:id" element={<Suspense fallback={<PageLoader />}><TenderDetail /></Suspense>} />
                  <Route path="/documents" element={<Suspense fallback={<PageLoader />}><Documents /></Suspense>} />
                  <Route path="/documents/:section" element={<Suspense fallback={<PageLoader />}><Documents /></Suspense>} />
                  <Route path="/team" element={<Suspense fallback={<PageLoader />}><Team /></Suspense>} />
                  <Route path="/team/:section" element={<Suspense fallback={<PageLoader />}><Team /></Suspense>} />
                  <Route path="/chantier" element={<Suspense fallback={<PageLoader />}><Chantier /></Suspense>} />
                  <Route path="/chantier/:projectId" element={<Suspense fallback={<PageLoader />}><Chantier /></Suspense>} />
                  <Route path="/chantier/:projectId/:section" element={<Suspense fallback={<PageLoader />}><Chantier /></Suspense>} />
                  <Route path="/references" element={<Suspense fallback={<PageLoader />}><References /></Suspense>} />
                  <Route path="/references/:id" element={<Suspense fallback={<PageLoader />}><ReferenceDetail /></Suspense>} />
                  <Route path="/materials" element={<Suspense fallback={<PageLoader />}><Materials /></Suspense>} />
                  <Route path="/objects" element={<Suspense fallback={<PageLoader />}><Objects /></Suspense>} />
                  <Route path="/planning" element={<Suspense fallback={<PageLoader />}><Workflow /></Suspense>} />
                  <Route path="/campaigns" element={<Suspense fallback={<PageLoader />}><Campaigns /></Suspense>} />
                  <Route path="/campaigns/:id" element={<Suspense fallback={<PageLoader />}><CampaignDetail /></Suspense>} />
                  <Route path="/media-planning" element={<Suspense fallback={<PageLoader />}><MediaPlanning /></Suspense>} />
                  <Route path="/documentation" element={<Suspense fallback={<PageLoader />}><Documentation /></Suspense>} />
                  <Route path="/documentation/:id" element={<Suspense fallback={<PageLoader />}><DocumentationPage /></Suspense>} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
              </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
