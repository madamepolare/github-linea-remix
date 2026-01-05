import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Edit, RotateCcw, Eye, Code, Save, X } from "lucide-react";
import { useEmailTemplates, EmailTemplate, DEFAULT_TEMPLATES } from "@/hooks/useEmailTemplates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TEMPLATE_LABELS: Record<string, string> = {
  workspace_invite: "Invitation au workspace",
  meeting_convocation: "Convocation réunion",
  partner_invitation: "Invitation partenaire",
};

export function EmailTemplatesSettings() {
  const { templates, isLoading, updateTemplate, initializeDefaultTemplates } = useEmailTemplates();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [editForm, setEditForm] = useState({
    subject: '',
    body_html: '',
  });

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      subject: template.subject,
      body_html: template.body_html,
    });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      subject: editForm.subject,
      body_html: editForm.body_html,
    });
    
    setEditingTemplate(null);
  };

  const handleInitialize = async () => {
    await initializeDefaultTemplates.mutateAsync();
  };

  const renderPreview = (html: string) => {
    // Replace variables with example values for preview
    const exampleValues: Record<string, string> = {
      '{{inviter_name}}': 'Jean Dupont',
      '{{workspace_name}}': 'Mon Agence',
      '{{role}}': 'membre',
      '{{invite_url}}': '#',
      '{{year}}': new Date().getFullYear().toString(),
      '{{meeting_number}}': '5',
      '{{project_name}}': 'Projet Exemple',
      '{{meeting_date}}': '15 janvier 2026',
      '{{meeting_time}}': '14h00',
      '{{meeting_location}}': '123 Rue de l\'Architecture',
      '{{custom_message}}': 'Merci de confirmer votre présence.',
      '{{agency_name}}': 'Mon Agence',
      '{{tender_name}}': 'Construction École Primaire',
      '{{specialty}}': 'Structure',
      '{{deadline}}': '31 janvier 2026',
    };

    let previewHtml = html;
    Object.entries(exampleValues).forEach(([key, value]) => {
      previewHtml = previewHtml.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    
    // Remove mustache conditionals for preview
    previewHtml = previewHtml.replace(/\{\{#\w+\}\}/g, '').replace(/\{\{\/\w+\}\}/g, '');

    return previewHtml;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const hasTemplates = templates && templates.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Templates d'emails</CardTitle>
                <CardDescription>
                  Personnalisez les emails envoyés par l'application
                </CardDescription>
              </div>
            </div>
            {!hasTemplates && (
              <Button onClick={handleInitialize} disabled={initializeDefaultTemplates.isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Initialiser les templates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!hasTemplates ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun template configuré</p>
              <p className="text-sm">Cliquez sur "Initialiser les templates" pour créer les templates par défaut</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                    <div className="flex gap-1 mt-2">
                      {template.variables.slice(0, 3).map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => 
                        updateTemplate.mutate({ id: template.id, is_active: checked })
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Modifier le template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Sujet de l'email</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                placeholder="Sujet..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Contenu HTML</Label>
                <div className="flex items-center gap-2">
                  <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'code' | 'preview')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="code" className="text-xs px-2">
                        <Code className="h-3 w-3 mr-1" />
                        Code
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs px-2">
                        <Eye className="h-3 w-3 mr-1" />
                        Aperçu
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {previewMode === 'code' ? (
                <Textarea
                  value={editForm.body_html}
                  onChange={(e) => setEditForm({ ...editForm, body_html: e.target.value })}
                  className="font-mono text-sm min-h-[400px]"
                  placeholder="HTML du template..."
                />
              ) : (
                <ScrollArea className="h-[400px] border rounded-lg">
                  <div 
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: renderPreview(editForm.body_html) }}
                  />
                </ScrollArea>
              )}
            </div>

            {editingTemplate && (
              <div>
                <Label className="text-muted-foreground">Variables disponibles</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {editingTemplate.variables.map((v) => (
                    <Badge 
                      key={v} 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-accent"
                      onClick={() => {
                        const variable = `{{${v}}}`;
                        setEditForm({ ...editForm, body_html: editForm.body_html + variable });
                      }}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
