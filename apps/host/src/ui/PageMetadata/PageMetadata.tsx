import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Morten Broesby-Olsen';

type PageMetadataProps = {
  title: string;
  description: string;
  pathname: string;
  type?: 'website' | 'article';
};

function buildCanonicalUrl(pathname: string) {
  if (typeof window === 'undefined') {
    return pathname;
  }

  return new URL(pathname, window.location.origin).toString();
}

export function PageMetadata({
  title,
  description,
  pathname,
  type = 'website',
}: PageMetadataProps) {
  const resolvedTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = buildCanonicalUrl(pathname);

  return (
    <Helmet defer={false}>
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
