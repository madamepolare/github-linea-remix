import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PenLine, Eye, Code, Save, Loader2, RotateCcw, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_SIGNATURE = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p style="margin: 0;">Cordialement,</p>
  <p style="margin: 8px 0 0 0; font-weight: 600;">{{user_name}}</p>
  <p style="margin: 4px 0 0 0; color: #666;">{{workspace_name}}</p>
  {{#phone}}<p style="margin: 4px 0 0 0; color: #666;">Tél: {{phone}}</p>{{/phone}}
  {{#email}}<p style="margin: 4px 0 0 0; color: #666;">{{email}}</p>{{/email}}
  {{#website}}<p style="margin: 4px 0 0 0;"><a href="{{website}}" style="color: #0066cc;">{{website}}</a></p>{{/website}}
</div>`;

interface WorkspaceDetails {
  name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  email_signature?: string | null;
  email_signature_enabled?: boolean | null;
}

export function EmailSignatureSettings() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails | null>(null);
  const [signature, setSignature] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("preview");

  // Fetch current signature and workspace details
  useEffect(() => {
    const fetchData = async () => {
      if (!activeWorkspace?.id) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from("workspaces")
        .select("name, phone, email, website, address, city, postal_code, email_signature, email_signature_enabled")
        .eq("id", activeWorkspace.id)
        .single();
      
      if (!error && data) {
        setWorkspaceDetails(data);
        setSignature(data.email_signature || "");
        setEnabled(data.email_signature_enabled ?? true);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [activeWorkspace?.id]);

  const handleSave = async () => {
    if (!activeWorkspace?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          email_signature: signature,
          email_signature_enabled: enabled,
        })
        .eq("id", activeWorkspace.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["workspace", activeWorkspace.id] });
      toast.success("Signature email enregistrée");
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSignature(DEFAULT_SIGNATURE);
    toast.info("Signature réinitialisée au modèle par défaut");
  };

  const renderPreview = (html: string) => {
    // Replace variables with example values
    const exampleValues: Record<string, string> = {
      "{{user_name}}": "Jean Dupont",
      "{{workspace_name}}": workspaceDetails?.name || "Mon Agence",
      "{{phone}}": workspaceDetails?.phone || "01 23 45 67 89",
      "{{email}}": workspaceDetails?.email || "contact@monagence.fr",
      "{{website}}": workspaceDetails?.website || "www.monagence.fr",
      "{{address}}": workspaceDetails?.address || "123 Rue de l'Architecture",
      "{{city}}": workspaceDetails?.city || "Paris",
      "{{postal_code}}": workspaceDetails?.postal_code || "75001",
    };

    let preview = html;
    Object.entries(exampleValues).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    });

    // Handle conditional blocks
    preview = preview.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
      const value = exampleValues[`{{${key}}}`];
      return value ? content : "";
    });

    return preview;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Signature Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Signature Email
            </CardTitle>
            <CardDescription>
              Cette signature sera ajoutée automatiquement à tous vos emails sortants
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="signature-enabled" className="text-sm text-muted-foreground">
              Activer
            </Label>
            <Switch
              id="signature-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variables info */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Variables disponibles :</p>
              <p className="text-muted-foreground text-xs">
                <code className="bg-background px-1 rounded">{"{{user_name}}"}</code>,{" "}
                <code className="bg-background px-1 rounded">{"{{workspace_name}}"}</code>,{" "}
                <code className="bg-background px-1 rounded">{"{{phone}}"}</code>,{" "}
                <code className="bg-background px-1 rounded">{"{{email}}"}</code>,{" "}
                <code className="bg-background px-1 rounded">{"{{website}}"}</code>,{" "}
                <code className="bg-background px-1 rounded">{"{{address}}"}</code>,{" "}
                <code className="bg-background px-1 rounded">{"{{city}}"}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "code" | "preview")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              Code HTML
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="mt-4">
            <Textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Entrez votre signature HTML..."
              className="min-h-[200px] font-mono text-sm"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[200px] border rounded-lg bg-white p-4">
              {signature ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: renderPreview(signature) }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Aucune signature configurée
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}