import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, Save, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const workspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

export function WorkspaceSettings() {
  const { activeWorkspace, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: activeWorkspace?.name || "",
      slug: activeWorkspace?.slug || "",
    },
  });

  const handleSubmit = async (data: WorkspaceFormData) => {
    if (!activeWorkspace) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name: data.name, slug: data.slug })
        .eq("id", activeWorkspace.id);

      if (error) {
        if (error.message.includes("duplicate")) {
          toast({
            variant: "destructive",
            title: "Slug already taken",
            description: "Please choose a different workspace URL.",
          });
        } else {
          throw error;
        }
        return;
      }

      await refreshProfile();
      toast({
        title: "Workspace updated",
        description: "Your workspace settings have been saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating workspace",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Workspace Details
              </CardTitle>
              <CardDescription>Manage your workspace settings</CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {activeWorkspace.plan} plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="My Architecture Studio"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                    archimind.app/
                  </span>
                  <Input
                    id="slug"
                    className="rounded-l-none"
                    {...form.register("slug")}
                  />
                </div>
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Workspace</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all its data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
