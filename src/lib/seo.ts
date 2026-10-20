import { siteConfig } from '@/config/site';

const LOGO_PATH = '/android-chrome-512x512.png';

/** Brand claim, used in title, meta description and JSON-LD. */
export const CLAIM = 'Sweet Vitamins for Generations';

export interface ProductLineMeta {
  /** Line name, e.g. "Gen Z". */
  name: string;
  minAge: number;
  maxAge: number;
}

export interface PageMeta {
  title: string;
  description: string;
  /** Path with leading slash, no trailing slash except "/". */
  path: string;
  /** Adds noindex (thank-you page): the page is for people who just signed up, not for search. */
  noindex?: boolean;
  /** Set on the home page: adds Brand and one pre-launch Product per version to the JSON-LD graph. */
  productLines?: readonly ProductLineMeta[];
}

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path === '/' ? '/' : path}`;
}

/**
 * JSON-LD graph: Organization and Brand on every page, WebSite on the home page, WebPage for the
 * current page, and on the home page one Product per version (each names the Brand and the
 * target age range; no offers, because nothing is for sale yet).
 */
export function buildJsonLd({ title, description, path, productLines }: PageMeta) {
  const origin = siteConfig.url;
  const pageUrl = absoluteUrl(path);
  const organizationId = `${origin}/#organization`;
  const brandId = `${origin}/#brand`;
  const websiteId = `${origin}/#website`;

  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteConfig.name,
    url: `${origin}/`,
    slogan: CLAIM,
    logo: {
      '@type': 'ImageObject',
      url: `${origin}${LOGO_PATH}`,
      width: 512,
      height: 512,
    },
  };

  const brand = {
    '@type': 'Brand',
    '@id': brandId,
    name: siteConfig.name,
    slogan: CLAIM,
    url: `${origin}/`,
    logo: `${origin}${LOGO_PATH}`,
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

  const graph: object[] = path === '/' ? [organization, brand, website, webpage] : [organization, brand, webpage];

  for (const line of productLines ?? []) {
    graph.push({
      '@type': 'Product',
      '@id': `${pageUrl}#${line.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${siteConfig.name} Multivitamin for ${line.name}`,
      description: `${siteConfig.name} Multivitamin for ${line.name}: sugar-free multivitamin gummies with a liquid center. Coming soon.`,
      url: pageUrl,
      category: 'Multivitamin gummies',
      brand: { '@id': brandId },
      audience: {
        '@type': 'PeopleAudience',
        suggestedMinAge: line.minAge,
        suggestedMaxAge: line.maxAge,
      },
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
