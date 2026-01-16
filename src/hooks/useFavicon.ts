import { useEffect } from "react";
import { useAgencyInfo } from "./useAgencyInfo";

const DEFAULT_FAVICON = "/favicon.ico";

export function useFavicon() {
  const { agencyInfo } = useAgencyInfo();

  useEffect(() => {
    const faviconUrl = agencyInfo?.favicon_url || agencyInfo?.logo_url || DEFAULT_FAVICON;
    
    // Find or create favicon link element
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    
    // Update href
    link.href = faviconUrl;
    
    // Also update apple-touch-icon if it exists
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleLink && (agencyInfo?.favicon_url || agencyInfo?.logo_url)) {
      appleLink = document.createElement("link");
      appleLink.rel = "apple-touch-icon";
      document.head.appendChild(appleLink);
    }
    if (appleLink) {
      appleLink.href = faviconUrl;
    }

    return () => {
      // Cleanup not needed as we want favicon to persist
    };
  }, [agencyInfo?.favicon_url, agencyInfo?.logo_url]);
}
