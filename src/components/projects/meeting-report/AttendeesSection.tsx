import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { AttendeeWithType } from "./types";

interface AttendeesSectionProps {
  attendees: AttendeeWithType[];
  contacts: Array<{
    id: string;
    name: string;
    company?: { name: string } | null;
    email?: string | null;
    contact_type?: string | null;
  }>;
  companies: Array<{
    id: string;
    name: string;
    industry?: string | null;
  }>;
  redactorName: string | null;
  selectedContactToAdd: string | null;
  onSelectedContactChange: (id: string | null) => void;
  onAddAttendee: () => void;
  onRemoveAttendee: (index: number) => void;
  onTogglePresence: (index: number) => void;
  onAddMOETeam: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  moa: { label: "MOA", color: "bg-blue-500" },
  bet: { label: "BET", color: "bg-purple-500" },
  entreprise: { label: "Entreprise", color: "bg-orange-500" },
  archi: { label: "Architecte", color: "bg-green-500" },
  other: { label: "Autre", color: "bg-gray-500" },
};

export function AttendeesSection({
  attendees,
  contacts,
  companies,
  redactorName,
  selectedContactToAdd,
  onSelectedContactChange,
  onAddAttendee,
  onRemoveAttendee,
  onTogglePresence,
  onAddMOETeam,
}: AttendeesSectionProps) {
  const presentCount = attendees.filter(a => a.present).length;

  return (
    <div className="space-y-4">
      {/* Rédacteur */}
      {redactorName && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            Rédacteur
          </Badge>
          <span className="text-sm font-medium">{redactorName}</span>
        </div>
      )}

      {/* Add participant controls */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedContactToAdd || "none"}
          onValueChange={(v) => onSelectedContactChange(v === "none" ? null : v)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Ajouter un participant..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sélectionner...</SelectItem>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                {contact.name} {contact.company ? `(${contact.company.name})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onAddAttendee} disabled={!selectedContactToAdd}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onAddMOETeam}>
          <Users className="h-4 w-4 mr-1" />
          Équipe MOE
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          {presentCount} présent(s) / {attendees.length} invité(s)
        </span>
      </div>

      {attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun participant. Ajoutez des contacts ou importez l'équipe MOE.
        </p>
      ) : (
        <div className="grid gap-2">
          {attendees.map((att, idx) => {
            const company = att.company_id
              ? companies.find(c => c.id === att.company_id)
              : null;
            const typeInfo = TYPE_CONFIG[att.type || "other"] || TYPE_CONFIG.other;

            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  att.present
                    ? "border-green-500/50 bg-green-50 dark:bg-green-950/30"
                    : "border-red-400/50 bg-red-50 dark:bg-red-950/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={att.present}
                    onCheckedChange={() => onTogglePresence(idx)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {att.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {att.present ? (
                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <UserX className="h-3.5 w-3.5 text-red-500" />
                      )}
                      {att.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {company && (
                        <span className="text-xs text-muted-foreground">{company.name}</span>
                      )}
                      <Badge
                        variant="secondary"
                        className={`text-[10px] text-white px-1.5 py-0 h-4 ${typeInfo.color}`}
                      >
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRemoveAttendee(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
