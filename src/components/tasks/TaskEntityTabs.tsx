import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENTITY_TABS } from "@/lib/taskTypes";

interface TaskEntityTabsProps {
  value: string;
  onChange: (value: string) => void;
}

export function TaskEntityTabs({ value, onChange }: TaskEntityTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="h-9 p-1 bg-muted/50">
        {ENTITY_TABS.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            className="h-7 px-3 text-xs"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
