import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { MainLayout } from "./MainLayout";
import { PageHeader } from "./PageHeader";

interface PageLayoutProps {
  /** Page icon */
  icon?: LucideIcon;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Actions slot (view switchers, etc.) */
  actions?: ReactNode;
  /** Tabs slot (navigation tabs) */
  tabs?: ReactNode;
  /** Filters slot */
  filters?: ReactNode;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Page content */
  children: ReactNode;
  /** Content padding - default is true */
  contentPadding?: boolean;
  /** Content overflow - default is "auto" */
  contentOverflow?: "auto" | "hidden";
}

export function PageLayout({
  icon,
  title,
  description,
  actions,
  tabs,
  filters,
  primaryAction,
  children,
  contentPadding = true,
  contentOverflow = "auto",
}: PageLayoutProps) {
  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={icon}
          title={title}
          description={description}
          actions={actions}
          tabs={tabs}
          filters={filters}
          primaryAction={primaryAction}
        />
        <div
          className={`flex-1 ${contentOverflow === "auto" ? "overflow-auto" : "overflow-hidden"} ${contentPadding ? "px-6 sm:px-8 py-6" : ""}`}
        >
          {children}
        </div>
      </div>
    </MainLayout>
  );
}
