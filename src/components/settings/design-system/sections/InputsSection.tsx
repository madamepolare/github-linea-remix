import { ComponentShowcase } from "../ComponentShowcase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Mail, Lock } from "lucide-react";

export function InputsSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Input"
        description="Champ de saisie de texte standard"
        filePath="src/components/ui/input.tsx"
        importStatement='import { Input } from "@/components/ui/input"'
      >
        <div className="space-y-4 max-w-sm">
          <Input placeholder="Placeholder..." />
          <Input value="Valeur saisie" readOnly />
          <Input disabled placeholder="Désactivé" />
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Input avec icônes"
        description="Champs avec icônes intégrées"
        filePath="src/components/ui/input.tsx"
        importStatement='import { Input } from "@/components/ui/input"'
      >
        <div className="space-y-4 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-9" />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Email" type="email" className="pl-9" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Mot de passe" type="password" className="pl-9" />
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Input avec Label"
        description="Combinaison Label + Input"
        filePath="src/components/ui/label.tsx"
        importStatement='import { Label } from "@/components/ui/label"'
      >
        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" placeholder="Jean Dupont" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="jean@exemple.com" />
            <p className="text-xs text-muted-foreground">
              Nous ne partagerons jamais votre email.
            </p>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Textarea"
        description="Zone de texte multi-lignes"
        filePath="src/components/ui/textarea.tsx"
        importStatement='import { Textarea } from "@/components/ui/textarea"'
      >
        <div className="max-w-md">
          <Textarea placeholder="Écrivez votre message ici..." rows={4} />
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Select"
        description="Menu déroulant de sélection"
        filePath="src/components/ui/select.tsx"
        importStatement='import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"'
      >
        <div className="max-w-sm">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Checkbox"
        description="Case à cocher"
        filePath="src/components/ui/checkbox.tsx"
        importStatement='import { Checkbox } from "@/components/ui/checkbox"'
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accepter les conditions</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="checked" defaultChecked />
            <Label htmlFor="checked">Option cochée</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="disabled" disabled />
            <Label htmlFor="disabled" className="text-muted-foreground">Désactivé</Label>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Switch"
        description="Interrupteur on/off"
        filePath="src/components/ui/switch.tsx"
        importStatement='import { Switch } from "@/components/ui/switch"'
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Notifications</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="marketing" defaultChecked />
            <Label htmlFor="marketing">Emails marketing</Label>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="RadioGroup"
        description="Groupe de boutons radio"
        filePath="src/components/ui/radio-group.tsx"
        importStatement='import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"'
      >
        <RadioGroup defaultValue="option1">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option1" id="r1" />
            <Label htmlFor="r1">Option 1</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option2" id="r2" />
            <Label htmlFor="r2">Option 2</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="option3" id="r3" />
            <Label htmlFor="r3">Option 3</Label>
          </div>
        </RadioGroup>
      </ComponentShowcase>
    </div>
  );
}
