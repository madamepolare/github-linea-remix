import { useState } from "react";
import { Building2, User, Target, Plus, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { THIN_STROKE } from "@/components/ui/icon";

interface CRMAddDropdownProps {
  onCreateContact: () => void;
  onCreateCompany: () => void;
  onCreateLead: () => void;
  onAIProspecting?: () => void;
}

export function CRMAddDropdown({
  onCreateContact,
  onCreateCompany,
  onCreateLead,
  onAIProspecting,
}: CRMAddDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
          <span className="hidden sm:inline">Ajouter</span>
          <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={THIN_STROKE} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <DropdownMenuItem
          onClick={() => {
            onCreateContact();
            setOpen(false);
          }}
          className="gap-2 cursor-pointer"
        >
          <User className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
          <span>Contact</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onCreateCompany();
            setOpen(false);
          }}
          className="gap-2 cursor-pointer"
        >
          <Building2 className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
          <span>Entreprise</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onCreateLead();
            setOpen(false);
          }}
          className="gap-2 cursor-pointer"
        >
          <Target className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
          <span>Opportunité</span>
        </DropdownMenuItem>
        {onAIProspecting && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onAIProspecting();
                setOpen(false);
              }}
              className="gap-2 cursor-pointer text-primary"
            >
              <Sparkles className="h-4 w-4" strokeWidth={THIN_STROKE} />
              <span>Ajouter avec l'IA</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
