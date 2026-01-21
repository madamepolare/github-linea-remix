import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Upload, Calendar } from "lucide-react";
import { ApprenticeCalendarTab } from "./ApprenticeCalendarTab";
import { ApprenticeManualTab } from "./ApprenticeManualTab";

interface ApprenticeScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function ApprenticeScheduleDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: ApprenticeScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Planning alternance - {userName}
          </DialogTitle>
          <DialogDescription>
            Configurez les jours école/entreprise pour cet alternant
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Import PDF
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Calendar className="h-4 w-4" />
              Manuel
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="upload" className="mt-0 h-full">
              <ApprenticeCalendarTab userId={userId} userName={userName} />
            </TabsContent>
            
            <TabsContent value="manual" className="mt-0 h-full">
              <ApprenticeManualTab 
                userId={userId} 
                userName={userName}
                onClose={() => onOpenChange(false)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
