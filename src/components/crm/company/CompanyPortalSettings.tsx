import { PortalSettingsBase } from '@/components/portal/PortalSettingsBase';

interface CompanyPortalSettingsProps {
  companyId: string;
  companyName: string;
}

export function CompanyPortalSettings({ companyId, companyName }: CompanyPortalSettingsProps) {
  return (
    <PortalSettingsBase
      portalType="company"
      entityId={companyId}
      entityName={companyName}
    />
  );
}