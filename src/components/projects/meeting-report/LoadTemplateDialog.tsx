import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MEETING_REPORT_TEMPLATES, MeetingReportTemplate } from "@/lib/meetingReportTemplates";
import { FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadTemplateDialogProps {
  onSelectTemplate: (template: MeetingReportTemplate) => void;
  trigger?: React.ReactNode;
}

export function LoadTemplateDialog({ onSelectTemplate, trigger }: LoadTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleApply = () => {
    const template = MEETING_REPORT_TEMPLATES.find(t => t.id === selected);
    if (template) {
      onSelectTemplate(template);
      setOpen(false);
      setSelected(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" />
            Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Charger un template de CR</DialogTitle>
          <DialogDescription>
            Sélectionnez un template adapté à votre type de projet. Les sections seront pré-remplies avec des contenus types.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          {MEETING_REPORT_TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "relative p-4 cursor-pointer transition-all hover:border-primary/50",
                selected === template.id && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setSelected(template.id)}
            >
              {selected === template.id && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {template.data.sqe && (
                  <Badge variant="outline" className="text-[10px]">SQE</Badge>
                )}
                {template.data.financial?.enabled && (
                  <Badge variant="outline" className="text-[10px]">Financier</Badge>
                )}
                {template.data.context && (
                  <Badge variant="outline" className="text-[10px]">Contexte</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleApply} disabled={!selected}>
            Appliquer le template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
