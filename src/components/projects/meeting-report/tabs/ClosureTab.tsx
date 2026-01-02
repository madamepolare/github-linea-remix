import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { TasksSection } from "../TasksSection";
import { ReportData, DistributionRecipient } from "@/hooks/useMeetingReportData";
import { AttendeeWithType, ExternalTask } from "../types";
import { Task } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { parseISO } from "date-fns";
import {
  CheckSquare, Calendar, Users, FileSignature, MapPin, Clock, Video,
  Building, Mail, Send, Plus, Trash2, Sparkles,
} from "lucide-react";

interface ClosureTabProps {
  reportData: ReportData;
  onUpdateReportData: <K extends keyof ReportData>(section: K, value: ReportData[K]) => void;
  onUpdateField: <K extends keyof ReportData>(section: K, field: keyof ReportData[K], value: unknown) => void;
  // Tasks
  internalTasks: Task[];
  externalTasks: ExternalTask[];
  onCreateInternalTask: (task: Partial<Task>) => void;
  onCreateExternalTask: (task: Omit<ExternalTask, "id">) => void;
  onToggleExternalTask: (id: string, completed: boolean) => void;
  onUpdateExternalTaskComment: (id: string, comment: string) => void;
  onToggleInternalTask: (id: string, completed: boolean) => void;
  attendeeNames: { name: string; type: string }[];
  // AI Summary
  aiSummary: string;
  isGeneratingAI: boolean;
  onGenerateAISummary: () => void;
  // Attendees for distribution
  attendeesWithType: AttendeeWithType[];
}

const LOCATION_CONFIG = {
  site: { label: "Sur site", icon: Building },
  remote: { label: "Visio", icon: Video },
  office: { label: "Bureau", icon: MapPin },
};

export function ClosureTab({
  reportData,
  onUpdateReportData,
  onUpdateField,
  internalTasks,
  externalTasks,
  onCreateInternalTask,
  onCreateExternalTask,
  onToggleExternalTask,
  onUpdateExternalTaskComment,
  onToggleInternalTask,
  attendeeNames,
  aiSummary,
  isGeneratingAI,
  onGenerateAISummary,
  attendeesWithType,
}: ClosureTabProps) {
  // Initialize distribution list from attendees if empty
  const initializeDistributionList = () => {
    if (reportData.distribution_list.length === 0 && attendeesWithType.length > 0) {
      const recipients: DistributionRecipient[] = attendeesWithType
        .filter(a => a.email)
        .map(a => ({
          name: a.name,
          email: a.email!,
          type: a.type || "other",
          send_pdf: true,
        }));
      onUpdateReportData("distribution_list", recipients);
    }
  };

  const handleToggleRecipient = (index: number) => {
    const updated = [...reportData.distribution_list];
    updated[index] = { ...updated[index], send_pdf: !updated[index].send_pdf };
    onUpdateReportData("distribution_list", updated);
  };

  const handleAddRecipient = () => {
    onUpdateReportData("distribution_list", [
      ...reportData.distribution_list,
      { name: "", email: "", type: "other", send_pdf: true },
    ]);
  };

  const handleRemoveRecipient = (index: number) => {
    onUpdateReportData(
      "distribution_list",
      reportData.distribution_list.filter((_, i) => i !== index)
    );
  };

  const handleUpdateRecipient = (index: number, updates: Partial<DistributionRecipient>) => {
    const updated = [...reportData.distribution_list];
    updated[index] = { ...updated[index], ...updates };
    onUpdateReportData("distribution_list", updated);
  };

  const selectedCount = reportData.distribution_list.filter(r => r.send_pdf).length;

  return (
    <div className="space-y-4">
      {/* Section 12 - Actions à réaliser */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Actions à réaliser
            <Badge variant="secondary" className="text-xs">{internalTasks.length + externalTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TasksSection
            internalTasks={internalTasks}
            externalTasks={externalTasks}
            onCreateInternalTask={onCreateInternalTask}
            onCreateExternalTask={onCreateExternalTask}
            onToggleExternalTask={onToggleExternalTask}
            onUpdateExternalTaskComment={onUpdateExternalTaskComment}
            onToggleInternalTask={onToggleInternalTask}
            attendeeNames={attendeeNames}
          />
        </CardContent>
      </Card>

      {/* Section 13 - Prochaine réunion */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Prochaine réunion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <InlineDatePicker
                value={reportData.next_meeting.date ? parseISO(reportData.next_meeting.date) : undefined}
                onChange={(date) => onUpdateField("next_meeting", "date", date?.toISOString().split("T")[0] || null)}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Heure</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={reportData.next_meeting.time}
                  onChange={(e) => onUpdateField("next_meeting", "time", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lieu</Label>
              <Select
                value={reportData.next_meeting.location_type}
                onValueChange={(v) => onUpdateField("next_meeting", "location_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LOCATION_CONFIG) as Array<keyof typeof LOCATION_CONFIG>).map((key) => {
                    const config = LOCATION_CONFIG[key];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 14 - Diffusion */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Diffusion du compte rendu
              <Badge variant="secondary" className="text-xs">
                {selectedCount}/{reportData.distribution_list.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {reportData.distribution_list.length === 0 && attendeesWithType.some(a => a.email) && (
                <Button variant="outline" size="sm" onClick={initializeDistributionList} className="h-7 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Depuis participants
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleAddRecipient} className="h-7">
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {reportData.distribution_list.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun destinataire.</p>
              <p className="text-xs mt-1">Ajoutez des destinataires ou importez depuis les participants.</p>
            </div>
          ) : (
            reportData.distribution_list.map((recipient, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                  recipient.send_pdf ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                )}
              >
                <Checkbox
                  checked={recipient.send_pdf}
                  onCheckedChange={() => handleToggleRecipient(index)}
                />
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    value={recipient.name}
                    onChange={(e) => handleUpdateRecipient(index, { name: e.target.value })}
                    placeholder="Nom"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={recipient.email}
                    onChange={(e) => handleUpdateRecipient(index, { email: e.target.value })}
                    placeholder="Email"
                    type="email"
                    className="h-8 text-sm"
                  />
                  <Select
                    value={recipient.type}
                    onValueChange={(v) => handleUpdateRecipient(index, { type: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moa">MOA</SelectItem>
                      <SelectItem value="bet">BET</SelectItem>
                      <SelectItem value="entreprise">Entreprise</SelectItem>
                      <SelectItem value="archi">Architecte</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemoveRecipient(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Section 15 - Mentions légales */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" />
            Mentions et valeur contractuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <Textarea
              value={reportData.legal_mention}
              onChange={(e) => onUpdateReportData("legal_mention", e.target.value)}
              rows={3}
              className="resize-none bg-transparent border-0 p-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm text-muted-foreground">Délai de remarques :</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={reportData.legal_delay_days}
                onChange={(e) => onUpdateReportData("legal_delay_days", parseInt(e.target.value) || 7)}
                className="w-20 h-8"
                min={1}
                max={30}
              />
              <span className="text-sm text-muted-foreground">jours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Synthèse AI
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateAISummary}
              disabled={isGeneratingAI}
              className="h-7"
            >
              {isGeneratingAI ? (
                <>Génération...</>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Générer
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm whitespace-pre-wrap">{aiSummary}</p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Cliquez sur "Générer" pour créer une synthèse automatique.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
