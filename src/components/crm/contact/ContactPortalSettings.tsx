import { PortalSettingsBase } from '@/components/portal/PortalSettingsBase';

interface ContactPortalSettingsProps {
  contactId: string;
  contactName: string;
}

export function ContactPortalSettings({ contactId, contactName }: ContactPortalSettingsProps) {
  return (
    <PortalSettingsBase
      portalType="contact"
      entityId={contactId}
      entityName={contactName}
    />
  );
}