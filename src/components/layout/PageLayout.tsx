import { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

interface PageLayoutProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Actions slot (view switchers, etc.) */
  actions?: ReactNode;
  /** Filters slot */
  filters?: ReactNode;
  /** Primary action button - now handled by TopBar, kept for backwards compat */
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
  /** Hide the page header entirely */
  hideHeader?: boolean;
}

export function PageLayout({
  title,
  description,
  actions,
  filters,
  primaryAction,
  children,
  contentPadding = true,
  contentOverflow = "auto",
  hideHeader = false,
}: PageLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <PageHeader
          title={title}
          description={description}
          actions={actions}
          filters={filters}
          primaryAction={primaryAction}
        />
      )}
      <div
        className={`flex-1 ${contentOverflow === "auto" ? "overflow-auto" : "overflow-hidden"} ${contentPadding ? "px-4 sm:px-6 lg:px-8 py-2 sm:py-3" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
