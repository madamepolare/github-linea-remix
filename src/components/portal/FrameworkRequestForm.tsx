import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Loader2, Send, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  desired_deadline: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FrameworkRequestFormProps {
  token: string;
  portalData: {
    workspace?: { name?: string; logo_url?: string };
    contact?: { name?: string };
    projects?: Array<{ id: string; name: string }>;
  };
  onSuccess: () => void;
}

export function FrameworkRequestForm({ token, portalData, onSuccess }: FrameworkRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("framework-request-submit", {
        body: {
          token,
          title: values.title,
          description: values.description || null,
          priority: values.priority,
          desired_deadline: values.desired_deadline?.toISOString().split('T')[0] || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Demande envoyée avec succès !");
      onSuccess();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityLabels = {
    low: { label: "Basse", description: "Peut attendre" },
    medium: { label: "Normale", description: "À traiter normalement" },
    high: { label: "Urgente", description: "À traiter en priorité" },
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center pb-2">
        {portalData.workspace?.logo_url ? (
          <img
            src={portalData.workspace.logo_url}
            alt={portalData.workspace.name || "Logo"}
            className="h-12 w-auto mx-auto mb-4 object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
        )}
        <CardTitle className="text-2xl">Nouvelle demande</CardTitle>
        <CardDescription className="text-base">
          {portalData.contact?.name && (
            <span>Bonjour {portalData.contact.name}, </span>
          )}
          remplissez ce formulaire pour soumettre une nouvelle demande.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de la demande *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Création d'une plaquette commerciale"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description détaillée</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre demande en détail : contexte, objectifs, livrables attendus..."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Plus votre description est précise, plus nous pourrons répondre efficacement à votre demande.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priorité</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-3 gap-3"
                    >
                      {(["low", "medium", "high"] as const).map((priority) => (
                        <label
                          key={priority}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent",
                            field.value === priority
                              ? "border-primary bg-primary/5"
                              : "border-muted"
                          )}
                        >
                          <RadioGroupItem value={priority} className="sr-only" />
                          <span className={cn(
                            "text-sm font-medium",
                            priority === "high" && "text-destructive",
                            priority === "medium" && "text-primary",
                            priority === "low" && "text-muted-foreground"
                          )}>
                            {priorityLabels[priority].label}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {priorityLabels[priority].description}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desired_deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date souhaitée</FormLabel>
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
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Optionnel - Indiquez si vous avez une échéance particulière
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer ma demande
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
