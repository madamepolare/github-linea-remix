import { Users, User, Target } from "lucide-react";
import { GenericSettingsManager } from "../GenericSettingsManager";
import { DEFAULT_CONTACT_TYPES } from "@/lib/crmDefaults";
import { useCRMSettings } from "@/hooks/useCRMSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Map icon names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  "User": <User className="h-4 w-4" />,
  "Target": <Target className="h-4 w-4" />,
};

export function CRMContactsSettings() {
  const { contactTypes, isLoading } = useCRMSettings();

  return (
    <div className="space-y-6">
      {/* Quick preview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Types de contacts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Définissez si un contact est un simple Contact ou un Lead commercial actif.
          </p>
          {isLoading ? (
            <div className="h-8 bg-muted animate-pulse rounded" />
          ) : (
            <div className="flex flex-wrap gap-3">
              {contactTypes.map((type) => (
                <Badge 
                  key={type.key}
                  variant="outline"
                  className="py-2 px-3 gap-2 text-sm"
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
        title="Gérer les types"
        description="Personnalisez les types de contacts disponibles"
        icon={<Users className="h-5 w-5 text-primary" />}
        showColor
        defaultItems={DEFAULT_CONTACT_TYPES}
      />
    </div>
  );
}
