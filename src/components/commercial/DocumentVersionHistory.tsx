import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CommercialDocument, CommercialDocumentPhase } from '@/lib/commercialTypes';
import { Json } from '@/integrations/supabase/types';

interface DocumentVersionHistoryProps {
  documentId: string;
  currentDocument: Partial<CommercialDocument>;
  currentPhases: CommercialDocumentPhase[];
  onRestoreVersion?: (doc: Partial<CommercialDocument>, phases: CommercialDocumentPhase[]) => void;
}

export function DocumentVersionHistory({
  documentId,
  currentDocument,
  currentPhases,
  onRestoreVersion
}: DocumentVersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Fetch versions
  const { data: versions, isLoading } = useQuery({
    queryKey: ['commercial-document-versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commercial_document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!documentId && documentId !== 'new'
  });

  // Create version
  const createVersion = useMutation({
    mutationFn: async (notes?: string) => {
      if (!activeWorkspace) throw new Error('No active workspace');

      const nextVersion = versions && versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('commercial_document_versions')
        .insert({
          document_id: documentId,
          version_number: nextVersion,
          document_snapshot: currentDocument as unknown as Json,
          phases_snapshot: currentPhases as unknown as Json,
          workspace_id: activeWorkspace.id,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-versions', documentId] });
      toast.success('Version sauvegardée');
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde de la version');
    }
  });

  const handleRestoreVersion = (version: typeof versions extends (infer T)[] | undefined ? T : never) => {
    if (onRestoreVersion && version) {
      const doc = version.document_snapshot as unknown as Partial<CommercialDocument>;
      const phases = (version.phases_snapshot || []) as unknown as CommercialDocumentPhase[];
      onRestoreVersion(doc, phases);
      toast.success(`Version ${version.version_number} restaurée`);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Historique
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Historique des versions</SheetTitle>
          <SheetDescription>
            Consultez et restaurez les versions précédentes du document
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Button 
            onClick={() => createVersion.mutate(undefined)} 
            disabled={createVersion.isPending || documentId === 'new'}
            className="w-full"
          >
            {createVersion.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <History className="h-4 w-4 mr-2" />
            )}
            Créer une version
          </Button>

          <ScrollArea className="h-[calc(100vh-250px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Version {version.version_number}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(version.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                        {version.notes && (
                          <p className="text-sm mt-2">{version.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreVersion(version)}
                          title="Restaurer cette version"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune version enregistrée</p>
                <p className="text-sm">Créez une version pour sauvegarder l'état actuel</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
