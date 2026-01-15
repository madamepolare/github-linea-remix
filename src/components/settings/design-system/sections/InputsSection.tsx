import { ComponentStyleEditor } from "../ComponentStyleEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, Mail, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { useState } from "react";

const inputProperties = [
  {
    id: "input-bg",
    label: "Input Background",
    type: "color" as const,
    cssVariable: "--input",
  },
  {
    id: "border",
    label: "Border Color",
    type: "color" as const,
    cssVariable: "--border",
  },
  {
    id: "ring",
    label: "Focus Ring",
    type: "color" as const,
    cssVariable: "--ring",
  },
  {
    id: "radius",
    label: "Border Radius",
    type: "radius" as const,
    cssVariable: "--radius",
  },
];

export function InputsSection() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <ComponentStyleEditor
        componentName="Input"
        description="Champ de saisie texte de base"
        filePath="src/components/ui/input.tsx"
        usedIn={["Forms", "Search", "Dialogs", "Filters"]}
        properties={inputProperties}
        variants={[
          {
            name: "With Icons",
            render: (
              <div className="space-y-3 max-w-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-10" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="email@exemple.com" className="pl-10" />
                </div>
              </div>
            )
          },
          {
            name: "States",
            render: (
              <div className="space-y-3 max-w-sm">
                <Input placeholder="Normal" />
                <Input placeholder="Disabled" disabled />
                <Input placeholder="With error" className="border-destructive focus-visible:ring-destructive" />
              </div>
            )
          }
        ]}
      >
        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input placeholder="Entrez votre nom" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="email@exemple.com" />
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Password Input"
        description="Champ de mot de passe avec toggle visibilité"
        filePath="src/components/ui/input.tsx"
        usedIn={["Auth", "Settings"]}
        properties={[]}
      >
        <div className="max-w-sm space-y-2">
          <Label>Mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              className="pl-10 pr-10" 
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Textarea"
        description="Zone de texte multi-lignes"
        filePath="src/components/ui/textarea.tsx"
        usedIn={["Forms", "Comments", "Notes"]}
        properties={inputProperties}
      >
        <div className="max-w-md space-y-2">
          <Label>Description</Label>
          <Textarea placeholder="Entrez une description..." rows={4} />
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Select"
        description="Menu déroulant de sélection"
        filePath="src/components/ui/select.tsx"
        usedIn={["Forms", "Filters", "Settings"]}
        properties={inputProperties}
      >
        <div className="max-w-sm space-y-2">
          <Label>Pays</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">France</SelectItem>
              <SelectItem value="be">Belgique</SelectItem>
              <SelectItem value="ch">Suisse</SelectItem>
              <SelectItem value="ca">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Checkbox & Switch"
        description="Contrôles booléens"
        filePath="src/components/ui/checkbox.tsx"
        usedIn={["Forms", "Settings", "Filters"]}
        properties={[]}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accepter les conditions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Activer les notifications</Label>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Radio Group"
        description="Sélection exclusive"
        filePath="src/components/ui/radio-group.tsx"
        usedIn={["Forms", "Settings"]}
        properties={[]}
      >
        <RadioGroup defaultValue="option-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-1" id="option-1" />
            <Label htmlFor="option-1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-2" id="option-2" />
            <Label htmlFor="option-2">Option 2</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-3" id="option-3" />
            <Label htmlFor="option-3">Option 3</Label>
          </div>
        </RadioGroup>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Slider"
        description="Sélection de valeur sur une échelle"
        filePath="src/components/ui/slider.tsx"
        usedIn={["Settings", "Filters", "Editors"]}
        properties={[]}
      >
        <div className="max-w-sm space-y-4">
          <div className="space-y-2">
            <Label>Volume</Label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Prix (€)</Label>
            <Slider defaultValue={[25, 75]} max={100} step={5} />
          </div>
        </div>
      </ComponentStyleEditor>
    </div>
  );
}
