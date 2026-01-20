import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plug, 
  Sparkles, 
  Mail, 
  Calendar, 
  FileText, 
  Check, 
  X, 
  Settings2,
  ExternalLink,
  Zap
} from "lucide-react";
import { CalendarIntegrationsSettings } from "./CalendarIntegrationsSettings";
import { WorkspaceEmailSettings } from "./WorkspaceEmailSettings";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "ai" | "email" | "documents" | "calendar";
  icon: React.ReactNode;
  secretKey?: string;
  connectorId?: string;
  isConnected?: boolean;
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Recherche de leads IA avancée avec GPT-4",
    category: "ai",
    icon: <Sparkles className="h-5 w-5 text-emerald-500" />,
    secretKey: "OPENAI_API_KEY",
    docsUrl: "https://platform.openai.com"
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    description: "Recherche et scraping web pour la prospection IA",
    category: "ai",
    icon: <span className="text-lg">🔥</span>,
    secretKey: "FIRECRAWL_API_KEY",
    connectorId: "firecrawl",
    docsUrl: "https://firecrawl.dev"
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "Recherche IA intelligente et contextuelle",
    category: "ai",
    icon: <span className="text-lg">🔮</span>,
    secretKey: "PERPLEXITY_API_KEY",
    connectorId: "perplexity",
    docsUrl: "https://perplexity.ai"
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    description: "Génération vocale et text-to-speech IA",
    category: "ai",
    icon: <span className="text-lg">🎙️</span>,
    secretKey: "ELEVENLABS_API_KEY",
    connectorId: "elevenlabs",
    docsUrl: "https://elevenlabs.io"
  },
  {
    id: "resend",
    name: "Resend",
    description: "Envoi d'emails transactionnels",
    category: "email",
    icon: <Mail className="h-5 w-5 text-blue-500" />,
    secretKey: "RESEND_API_KEY",
    docsUrl: "https://resend.com"
  },
  {
    id: "llamaparse",
    name: "LlamaParse",
    description: "Parsing de documents PDF et OCR avancé",
    category: "documents",
    icon: <FileText className="h-5 w-5 text-orange-500" />,
    secretKey: "LLAMA_PARSE_API_KEY",
    docsUrl: "https://llamaindex.ai"
  },
];

export function IntegrationsSettings() {
  const [activeTab, setActiveTab] = useState("ai");
  const [connectedSecrets, setConnectedSecrets] = useState<string[]>([]);

  // Simulated check for connected secrets - in real app would check actual secrets
  useEffect(() => {
    // These are the secrets that are connected based on the project configuration
    setConnectedSecrets([
      "OPENAI_API_KEY",
      "FIRECRAWL_API_KEY",
      "PERPLEXITY_API_KEY", 
      "RESEND_API_KEY",
      "LLAMA_PARSE_API_KEY"
    ]);
  }, []);

  const isConnected = (secretKey?: string) => {
    if (!secretKey) return false;
    return connectedSecrets.includes(secretKey);
  };

  const getIntegrationsByCategory = (category: string) => {
    return INTEGRATIONS.filter(i => i.category === category);
  };

  const renderIntegrationCard = (integration: Integration) => {
    const connected = isConnected(integration.secretKey);
    
    return (
      <Card key={integration.id} className="relative">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                {integration.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{integration.name}</h4>
                  {connected ? (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                      <Check className="h-3 w-3" />
                      Connecté
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground gap-1">
                      <X className="h-3 w-3" />
                      Non connecté
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.docsUrl && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(integration.docsUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant={connected ? "outline" : "default"} 
                size="sm"
              >
                {connected ? (
                  <>
                    <Settings2 className="h-4 w-4 mr-1" />
                    Configurer
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1" />
                    Connecter
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Intégrations</CardTitle>
              <CardDescription>
                Gérez les connexions aux services externes et APIs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendriers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4 space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Connectez des services d'intelligence artificielle pour la prospection, la recherche et l'automatisation.
          </div>
          {getIntegrationsByCategory("ai").map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="email" className="mt-4 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Configurez les services d'envoi et de réception d'emails.
          </div>
          
          {/* Workspace Email Settings */}
          <WorkspaceEmailSettings />
          
          {/* Other email integrations */}
          {getIntegrationsByCategory("email").map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Services de traitement et d'analyse de documents.
          </div>
          {getIntegrationsByCategory("documents").map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <div className="text-sm text-muted-foreground mb-4">
            Synchronisez vos calendriers externes avec l'application.
          </div>
          <CalendarIntegrationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
