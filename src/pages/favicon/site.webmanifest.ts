import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';
import { colorToken } from '@/lib/colors';

export const GET: APIRoute = () => {
  const manifest = {
    name: siteConfig.name,
    short_name: siteConfig.name,
    icons: [
      { src: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: colorToken('--color-brand-pink'),
    background_color: colorToken('--color-surface'),
    display: 'standalone',
    start_url: '/',
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
