import { useEffect } from "react";

/**
 * Keep the browser title and description in sync with the mounted route.
 */
export function usePageMeta(title: string, description: string): void {
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = title;

    let descriptionMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );

    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }

    descriptionMeta.content = description;
  }, [description, title]);
}
