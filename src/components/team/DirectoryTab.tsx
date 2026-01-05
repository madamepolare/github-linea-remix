import { useState } from "react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, Phone, Download, Building2 } from "lucide-react";

const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
  viewer: "Lecteur",
};

export function DirectoryTab() {
  const { data: members, isLoading } = useTeamMembers();
  const [search, setSearch] = useState("");

  const filteredMembers = members?.filter((m) =>
    m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    m.profile?.department?.toLowerCase().includes(search.toLowerCase())
  );

  const exportVCard = (member: typeof members[0]) => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${member.profile?.full_name || ""}
EMAIL:${member.profile?.email || ""}
TEL:${member.profile?.phone || ""}
TITLE:${member.profile?.job_title || ""}
ORG:${member.profile?.department || ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${member.profile?.full_name || "contact"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email, poste..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers?.map((member) => {
          const initials = member.profile?.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "?";

          return (
            <Card key={member.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">{member.profile?.full_name || "Sans nom"}</h3>
                  {member.profile?.job_title && (
                    <p className="text-sm text-muted-foreground">{member.profile.job_title}</p>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {roleLabels[member.role] || member.role}
                  </Badge>

                  {member.profile?.department && (
                    <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>{member.profile.department}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t w-full justify-center">
                    {member.profile?.email && (
                      <a
                        href={`mailto:${member.profile.email}`}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title={member.profile.email}
                      >
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    {member.profile?.phone && (
                      <a
                        href={`tel:${member.profile.phone}`}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title={member.profile.phone}
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => exportVCard(member)}
                      title="Télécharger vCard"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun membre trouvé
        </div>
      )}
    </div>
  );
}
