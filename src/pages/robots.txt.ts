import type { APIRoute } from 'astro';

/**
 * Search and AI crawlers that are explicitly allowed. To block one, remove it from `allowed`
 * or add it to `blocked` (a blocked bot gets "Disallow: /"). See README, "robots.txt".
 */
const searchCrawlers = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'Applebot', 'YandexBot', 'Baiduspider'];
const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Meta-ExternalAgent',
  'Amazonbot',
  'cohere-ai',
];
const blocked: string[] = [];

const group = (agent: string, rule: 'Allow' | 'Disallow') => `User-agent: ${agent}\n${rule}: /\n`;

export const GET: APIRoute = ({ site }) => {
  const origin = (site?.toString() ?? '').replace(/\/+$/, '');
  const body = [
    '# robots.txt for Snugglegum™',
    '',
    group('*', 'Allow'),
    '# Search crawlers',
    ...searchCrawlers.filter((a) => !blocked.includes(a)).map((a) => group(a, 'Allow')),
    '# AI crawlers and assistants',
    ...aiCrawlers.filter((a) => !blocked.includes(a)).map((a) => group(a, 'Allow')),
    ...(blocked.length ? ['# Blocked', ...blocked.map((a) => group(a, 'Disallow'))] : []),
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
