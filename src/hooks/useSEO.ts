import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const BASE_URL = 'https://binthere.online';

function setMetaTag(selector: string, attribute: string, value: string) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [attr, val] = selector.match(/\[(.+?)="(.+?)"\]/)?.slice(1) || [];
    if (attr && val) el.setAttribute(attr, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function useSEO({ title, description, path, noindex, jsonLd }: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const canonicalUrl = `${BASE_URL}${path}`;
    setCanonical(canonicalUrl);

    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:url"]', 'content', canonicalUrl);

    if (noindex) {
      setMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow');
    }

    let jsonLdScript: HTMLScriptElement | null = null;
    if (jsonLd) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.text = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdScript);
    }

    return () => {
      document.title = prevTitle;
      setCanonical(`${BASE_URL}/`);
      if (noindex) {
        document.querySelector('meta[name="robots"]')?.remove();
      }
      if (jsonLdScript) {
        document.head.removeChild(jsonLdScript);
      }
    };
  }, [title, description, path, noindex, jsonLd]);
}
