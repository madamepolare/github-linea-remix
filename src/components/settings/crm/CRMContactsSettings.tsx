import { Users, User, Target } from "lucide-react";
import { GenericSettingsManager } from "../GenericSettingsManager";
import { DEFAULT_CONTACT_TYPES } from "@/lib/crmDefaults";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Map icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  "User": <User className="h-3 w-3" />,
  "Target": <Target className="h-3 w-3" />,
};

export function CRMContactsSettings() {
  const { contactTypes, isLoading } = useCRMSettings();

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Types de contacts configurés</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {contactTypes.map((type) => (
                <Badge 
                  key={type.key}
                  variant="outline"
                  className="py-1 px-2 gap-1.5"
                  style={{ 
                    borderColor: type.color,
                    color: type.color,
                  }}
                >
                  {type.icon && ICON_MAP[type.icon]}
                  {type.label}
                </Badge>
              ))}
              {contactTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun type configuré. Chargez les valeurs par défaut ci-dessous.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings manager */}
      <GenericSettingsManager
        settingType="contact_types"
        title="Types de contacts"
        description="Catégorisez vos contacts selon leur rôle (client, partenaire, fournisseur...)"
        icon={<Users className="h-5 w-5 text-primary" />}
        showColor
        defaultItems={DEFAULT_CONTACT_TYPES}
      />
    </div>
  );
}
