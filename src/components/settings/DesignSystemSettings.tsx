import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DesignSystemNav, DESIGN_SYSTEM_SECTIONS } from "./design-system/DesignSystemNav";
import { ColorsSection } from "./design-system/sections/ColorsSection";
import { TypographySection } from "./design-system/sections/TypographySection";
import { ButtonsSection } from "./design-system/sections/ButtonsSection";
import { BadgesSection } from "./design-system/sections/BadgesSection";
import { InputsSection } from "./design-system/sections/InputsSection";
import { CardsSection } from "./design-system/sections/CardsSection";
import { TablesSection } from "./design-system/sections/TablesSection";
import { DialogsSection } from "./design-system/sections/DialogsSection";
import { NavigationSection } from "./design-system/sections/NavigationSection";
import { BusinessSection } from "./design-system/sections/BusinessSection";
import { LayoutSection } from "./design-system/sections/LayoutSection";
import { Eye } from "lucide-react";

export function DesignSystemSettings() {
  const [activeSection, setActiveSection] = useState("colors");

  const currentSection = DESIGN_SYSTEM_SECTIONS.find(s => s.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case "colors": return <ColorsSection />;
      case "typography": return <TypographySection />;
      case "buttons": return <ButtonsSection />;
      case "badges": return <BadgesSection />;
      case "inputs": return <InputsSection />;
      case "cards": return <CardsSection />;
      case "tables": return <TablesSection />;
      case "dialogs": return <DialogsSection />;
      case "navigation": return <NavigationSection />;
      case "business": return <BusinessSection />;
      case "layout": return <LayoutSection />;
      default: return <ColorsSection />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Eye className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Design System Inspector
            <Badge variant="secondary">Admin</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Catalogue visuel de tous les composants UI
          </p>
        </div>
      </div>

      <div className="flex border rounded-lg overflow-hidden bg-card min-h-[600px]">
        <DesignSystemNav activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b bg-muted/20">
            <h3 className="font-medium">{currentSection?.label}</h3>
            <p className="text-sm text-muted-foreground">{currentSection?.description}</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6">{renderSection()}</div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
