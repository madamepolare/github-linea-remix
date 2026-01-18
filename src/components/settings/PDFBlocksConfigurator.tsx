import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GripVertical,
  FileText,
  FileSignature,
  Presentation,
  LayoutTemplate,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  PDFBlockConfig, 
  PDFDocumentConfig, 
  BLOCK_TYPE_LABELS, 
  BLOCK_TYPE_DESCRIPTIONS,
  DEFAULT_PDF_CONFIG,
  PDFBlockType
} from '@/lib/pdfBlockTypes';
import { ContractType } from '@/hooks/useContractTypes';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface PDFBlocksConfiguratorProps {
  contractType: ContractType;
  onSave: (pdfConfig: PDFDocumentConfig) => void;
  isLoading?: boolean;
}

type DocumentTypeTab = 'quote' | 'proposal';

const DOC_TYPE_INFO: Record<DocumentTypeTab, { label: string; icon: React.ReactNode; description: string }> = {
  quote: {
    label: 'Devis',
    icon: <FileText className="h-4 w-4" />,
    description: 'Document compact, format portrait'
  },
  proposal: {
    label: 'Proposition',
    icon: <Presentation className="h-4 w-4" />,
    description: 'Format paysage, style présentation'
  }
};

export function PDFBlocksConfigurator({ contractType, onSave, isLoading }: PDFBlocksConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<DocumentTypeTab>('quote');
  const [config, setConfig] = useState<PDFDocumentConfig>(
    contractType.pdf_config || DEFAULT_PDF_CONFIG
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const docType = activeTab;
    const blocks = [...config[docType]];
    const [reorderedItem] = blocks.splice(result.source.index, 1);
    blocks.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const updatedBlocks = blocks.map((block, index) => ({
      ...block,
      sort_order: index + 1
    }));

    setConfig(prev => ({
      ...prev,
      [docType]: updatedBlocks
    }));
    setHasChanges(true);
  };

  const toggleBlockRequired = (blockType: PDFBlockType) => {
    const docType = activeTab;
    setConfig(prev => ({
      ...prev,
      [docType]: prev[docType].map(block => 
        block.block_type === blockType 
          ? { ...block, is_required: !block.is_required }
          : block
      )
    }));
    setHasChanges(true);
  };

  const addBlock = (blockType: PDFBlockType) => {
    const docType = activeTab;
    const existingBlocks = config[docType];
    const alreadyExists = existingBlocks.some(b => b.block_type === blockType);
    
    if (alreadyExists) return;

    const newBlock: PDFBlockConfig = {
      block_type: blockType,
      sort_order: existingBlocks.length + 1,
      is_required: false
    };

    setConfig(prev => ({
      ...prev,
      [docType]: [...prev[docType], newBlock]
    }));
    setHasChanges(true);
  };

  const removeBlock = (blockType: PDFBlockType) => {
    const docType = activeTab;
    setConfig(prev => ({
      ...prev,
      [docType]: prev[docType].filter(b => b.block_type !== blockType)
    }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setConfig(DEFAULT_PDF_CONFIG);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
  };

  const currentBlocks = config[activeTab] || [];
  const availableBlockTypes: PDFBlockType[] = ['cover', 'header', 'client', 'project', 'lines', 'phases', 'totals', 'payment', 'conditions', 'signatures'];
  const unusedBlocks = availableBlockTypes.filter(
    type => !currentBlocks.some(b => b.block_type === type)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutTemplate className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Configuration PDF</CardTitle>
              <CardDescription>
                Personnalisez les blocs pour chaque type de document
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentTypeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {(Object.keys(DOC_TYPE_INFO) as DocumentTypeTab[]).map((docType) => (
              <TabsTrigger key={docType} value={docType} className="flex items-center gap-2">
                {DOC_TYPE_INFO[docType].icon}
                {DOC_TYPE_INFO[docType].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(DOC_TYPE_INFO) as DocumentTypeTab[]).map((docType) => (
            <TabsContent key={docType} value={docType} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {DOC_TYPE_INFO[docType].description}
              </p>

              {/* Current blocks with drag and drop */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blocs actifs (glisser pour réordonner)</Label>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="blocks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {currentBlocks
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((block, index) => (
                            <Draggable
                              key={block.block_type}
                              draggableId={block.block_type}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center justify-between p-3 border rounded-lg bg-card ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {BLOCK_TYPE_LABELS[block.block_type]}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {BLOCK_TYPE_DESCRIPTIONS[block.block_type]}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={block.is_required}
                                        onCheckedChange={() => toggleBlockRequired(block.block_type)}
                                        id={`required-${block.block_type}`}
                                      />
                                      <Label htmlFor={`required-${block.block_type}`} className="text-xs">
                                        Obligatoire
                                      </Label>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeBlock(block.block_type)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      Retirer
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Available blocks to add */}
              {unusedBlocks.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label className="text-sm font-medium">Blocs disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                    {unusedBlocks.map((blockType) => (
                      <Badge
                        key={blockType}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => addBlock(blockType)}
                      >
                        + {BLOCK_TYPE_LABELS[blockType]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}