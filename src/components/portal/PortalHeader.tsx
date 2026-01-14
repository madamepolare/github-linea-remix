import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, User } from 'lucide-react';

interface PortalHeaderProps {
  workspace: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
    crm_company: {
      id: string;
      name: string;
      logo_url: string | null;
    } | null;
  };
}

export function PortalHeader({ workspace, contact }: PortalHeaderProps) {
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          {/* Workspace branding */}
          <div className="flex items-center gap-3">
            {workspace.logo_url ? (
              <img 
                src={workspace.logo_url} 
                alt={workspace.name}
                className="h-10 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="font-semibold text-lg">{workspace.name}</span>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-sm">{contact.name}</p>
              {contact.crm_company && (
                <p className="text-xs text-muted-foreground">{contact.crm_company.name}</p>
              )}
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={contact.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
