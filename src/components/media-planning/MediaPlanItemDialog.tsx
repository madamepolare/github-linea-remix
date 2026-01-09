import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useMediaPlanMutations, CHANNEL_TYPES, FORMAT_OPTIONS, MediaPlanItem } from "@/hooks/useMediaPlanning";
import { useCampaigns } from "@/hooks/useCampaigns";

const mediaPlanItemSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  campaign_id: z.string().min(1, "La campagne est requise"),
  channel_type: z.string().min(1, "Le canal est requis"),
  format: z.string().optional(),
  publish_date: z.date(),
  budget: z.number().optional(),
});

type MediaPlanItemFormData = z.infer<typeof mediaPlanItemSchema>;

interface MediaPlanItemWithChannel extends MediaPlanItem {
  channel?: { channel_type?: string } | null;
}

interface MediaPlanItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MediaPlanItemWithChannel | null;
  defaultDate?: Date;
}

export function MediaPlanItemDialog({ 
  open, 
  onOpenChange, 
  item,
  defaultDate 
}: MediaPlanItemDialogProps) {
  const { createMediaPlanItem, updateMediaPlanItem } = useMediaPlanMutations();
  const { data: campaigns = [] } = useCampaigns();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MediaPlanItemFormData>({
    resolver: zodResolver(mediaPlanItemSchema),
    defaultValues: {
      title: item?.title || "",
      description: item?.description || "",
      campaign_id: item?.campaign_id || "",
      channel_type: (item?.channel as any)?.channel_type || "social",
      format: item?.format || "",
      publish_date: item?.publish_date ? new Date(item.publish_date) : defaultDate || new Date(),
      budget: item?.budget || undefined,
    },
  });

  const onSubmit = async (data: MediaPlanItemFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        campaign_id: data.campaign_id,
        format: data.format,
        publish_date: data.publish_date.toISOString().split('T')[0],
        budget: data.budget,
      };

      if (item) {
        await updateMediaPlanItem.mutateAsync({ id: item.id, data: payload });
      } else {
        await createMediaPlanItem.mutateAsync({
          ...payload,
          publish_date: payload.publish_date,
        });
      }
      onOpenChange(false);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {item ? "Modifier le placement" : "Nouveau placement média"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Post Instagram - Lancement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="campaign_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campagne</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une campagne" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="channel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHANNEL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FORMAT_OPTIONS.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="publish_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de publication</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contenu, message clé, CTA..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="500"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {item ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
