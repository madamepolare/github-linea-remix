import { useState } from "react";
import {
  LayoutDashboard,
  Clock,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetOverviewTab } from "./budget/BudgetOverviewTab";
import { BudgetTimeTab } from "./budget/BudgetTimeTab";
import { BudgetPurchasesTab } from "./budget/BudgetPurchasesTab";
import { BudgetEnvelopesTab } from "./budget/BudgetEnvelopesTab";

interface ProjectBudgetTabProps {
  projectId: string;
}

export function ProjectBudgetTab({ projectId }: ProjectBudgetTabProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <TabsList className="bg-transparent h-auto p-0">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger 
              value="envelopes" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Enveloppes
            </TabsTrigger>
            <TabsTrigger 
              value="time" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <Clock className="h-4 w-4 mr-2" />
              Temps passé
            </TabsTrigger>
            <TabsTrigger 
              value="purchases" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Achats & Provisions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <BudgetOverviewTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="envelopes" className="mt-4">
          <BudgetEnvelopesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <BudgetTimeTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="purchases" className="mt-4">
          <BudgetPurchasesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
