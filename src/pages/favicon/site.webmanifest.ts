import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';
import { colorToken } from '@/lib/colors';

export const GET: APIRoute = () => {
  const manifest = {
    id: '/',
    name: siteConfig.name,
    short_name: siteConfig.name,
    lang: siteConfig.locale,
    icons: [
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: colorToken('--color-brand-pink'),
    background_color: colorToken('--color-surface'),
    display: 'standalone',
    scope: '/',
    start_url: '/',
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
