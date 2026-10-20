import { useEffect } from "react";

export function useFavicon(href: string) {
  useEffect(() => {
    const previousLinks = Array.from(
      document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="shortcut icon"]'
      )
    );

    previousLinks.forEach((link) => link.remove());

    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = href.endsWith(".ico") ? "image/x-icon" : "image/svg+xml";
    favicon.href = href;
    document.head.appendChild(favicon);

    return () => {
      favicon.remove();
      previousLinks.forEach((link) => document.head.appendChild(link));
    };
  }, [href]);
}
