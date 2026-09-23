import { siteConfig } from '@/config/site';

const LOGO_PATH = '/favicon/android-chrome-512x512.png';

export interface PageMeta {
  title: string;
  description: string;
  /** Path with leading slash, no trailing slash except "/". */
  path: string;
  /** Set on a product page: adds Product + BreadcrumbList (Home > product) to the JSON-LD graph. */
  product?: { name: string };
}

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === '/' ? '/' : path}`;
}

/**
 * JSON-LD graph: Organization on every page, WebSite on the home page, WebPage for the current
 * page, and — on a product page — a Product node plus a Home > Product BreadcrumbList. Each
 * product page is meant to be understood on its own (see README, "SEO and GEO"), so its Product
 * node names the Snugglegum™ Organization as `brand` rather than assuming the reader already
 * visited the homepage.
 */
export function buildJsonLd({ title, description, path, product }: PageMeta) {
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

  const graph: object[] = path === '/' ? [organization, website, webpage] : [organization, webpage];

  if (product) {
    graph.push({
      '@type': 'Product',
      '@id': `${pageUrl}#product`,
      name: product.name,
      description,
      url: pageUrl,
      brand: { '@id': organizationId },
    });
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: siteConfig.name, item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: product.name, item: pageUrl },
      ],
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
