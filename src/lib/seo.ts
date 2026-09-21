import { siteConfig } from '@/config/site';

const LOGO_PATH = '/favicon/android-chrome-512x512.png';

export interface PageMeta {
  title: string;
  description: string;
  /** Path with leading slash, no trailing slash except "/". */
  path: string;
}

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === '/' ? '/' : path}`;
}

/** JSON-LD graph: Organization on every page, WebSite on the home page, WebPage for the current page. */
export function buildJsonLd({ title, description, path }: PageMeta) {
  const origin = siteConfig.url;
  const pageUrl = absoluteUrl(path);
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;

  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteConfig.name,
    url: `${origin}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${origin}${LOGO_PATH}`,
      width: 512,
      height: 512,
    },
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: `${origin}/`,
    name: siteConfig.name,
    inLanguage: siteConfig.locale,
    publisher: { '@id': organizationId },
  };

  const webpage = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    inLanguage: siteConfig.locale,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': organizationId },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': path === '/' ? [organization, website, webpage] : [organization, webpage],
  };
}
