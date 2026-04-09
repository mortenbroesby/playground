import { useEffect } from 'react';

const SITE_NAME = 'Morten Broesby-Olsen';

type PageMetadataProps = {
  title: string;
  description: string;
  pathname: string;
  type?: 'website' | 'article';
};

function ensureMetaTag(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
}

function ensureLinkTag(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
}

function buildCanonicalUrl(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

export function PageMetadata({
  title,
  description,
  pathname,
  type = 'website',
}: PageMetadataProps) {
  useEffect(() => {
    const resolvedTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    const canonicalUrl = buildCanonicalUrl(pathname);

    document.title = resolvedTitle;

    ensureMetaTag('meta[name="description"]', {
      name: 'description',
      content: description,
    });
    ensureMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: resolvedTitle,
    });
    ensureMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    });
    ensureMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: type,
    });
    ensureMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    });
    ensureMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary',
    });
    ensureMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: resolvedTitle,
    });
    ensureMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    });
    ensureLinkTag('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl,
    });
  }, [description, pathname, title, type]);

  return null;
}
