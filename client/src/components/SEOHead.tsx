import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

export function SEOHead({ title, description, canonicalUrl }: SEOHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute("content", description);
    }

    let metaOgTitle = document.querySelector('meta[property="og:title"]');
    if (title) {
      if (!metaOgTitle) {
        metaOgTitle = document.createElement("meta");
        metaOgTitle.setAttribute("property", "og:title");
        document.head.appendChild(metaOgTitle);
      }
      metaOgTitle.setAttribute("content", title);
    }

    let metaOgDescription = document.querySelector('meta[property="og:description"]');
    if (description) {
      if (!metaOgDescription) {
        metaOgDescription = document.createElement("meta");
        metaOgDescription.setAttribute("property", "og:description");
        document.head.appendChild(metaOgDescription);
      }
      metaOgDescription.setAttribute("content", description);
    }

    if (canonicalUrl) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute("href", canonicalUrl);
    }
  }, [title, description, canonicalUrl]);

  return null;
}
