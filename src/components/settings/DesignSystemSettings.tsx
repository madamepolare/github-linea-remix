import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DesignSystemNav, DESIGN_SYSTEM_SECTIONS, flattenSections } from "./design-system/DesignSystemNav";
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
import { TokenEditor } from "./design-system/TokenEditor";
import { CRMSection } from "./design-system/sections/modules/CRMSection";
import { ProjectsSection } from "./design-system/sections/modules/ProjectsSection";
import { TasksSection } from "./design-system/sections/modules/TasksSection";
import { CommercialSection } from "./design-system/sections/modules/CommercialSection";
import { InvoicingSection } from "./design-system/sections/modules/InvoicingSection";
import { TendersSection } from "./design-system/sections/modules/TendersSection";
import { TeamSection } from "./design-system/sections/modules/TeamSection";
import { WorkflowSection } from "./design-system/sections/modules/WorkflowSection";
import { LandingSection } from "./design-system/sections/modules/LandingSection";
import { PortalSection } from "./design-system/sections/modules/PortalSection";
import { Eye, Sparkles } from "lucide-react";

export function DesignSystemSettings() {
  const [activeSection, setActiveSection] = useState("tokens");

  const allSections = flattenSections(DESIGN_SYSTEM_SECTIONS);
  const currentSection = allSections.find(s => s.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case "tokens": return <TokenEditor />;
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
      case "crm": return <CRMSection />;
      case "projects": return <ProjectsSection />;
      case "tasks": return <TasksSection />;
      case "commercial": return <CommercialSection />;
      case "invoicing": return <InvoicingSection />;
      case "tenders": return <TendersSection />;
      case "team": return <TeamSection />;
      case "workflow": return <WorkflowSection />;
      case "landing": return <LandingSection />;
      case "portal": return <PortalSection />;
      default: return <TokenEditor />;
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
            <Badge variant="default" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Live Editor
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">
            Catalogue visuel avec éditeur en temps réel — 280+ composants
          </p>
        </div>
      </div>

      <div className="flex border rounded-lg overflow-hidden bg-card min-h-[700px]">
        <DesignSystemNav activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              {currentSection?.label}
              {currentSection?.badge && (
                <Badge variant="secondary" className="text-xs">
                  {currentSection.badge}
                </Badge>
              )}
            </h3>
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
