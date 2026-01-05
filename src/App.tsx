import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

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
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm"
                element={
                  <ProtectedRoute>
                    <CRM />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/companies/:id"
                element={
                  <ProtectedRoute>
                    <CompanyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/contacts/:id"
                element={
                  <ProtectedRoute>
                    <ContactDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm/leads/:id"
                element={
                  <ProtectedRoute>
                    <LeadDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Tasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/commercial"
                element={
                  <ProtectedRoute>
                    <Commercial />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/commercial/:id"
                element={
                  <ProtectedRoute>
                    <CommercialDocument />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenders"
                element={
                  <ProtectedRoute>
                    <Tenders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tenders/:id"
                element={
                  <ProtectedRoute>
                    <TenderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                }
              />
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
