import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// PUBLIC_ variables are exposed in the client bundle. None of them is a secret.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_'), ...process.env };

// Placeholder origin until the production domain is known (see README, open items).
const PLACEHOLDER_SITE = 'https://snugglegum.example';
const site = (env.PUBLIC_SITE_URL || PLACEHOLDER_SITE).replace(/\/+$/, '');

// @astrojs/sitemap writes sitemap-index.xml and sitemap-0.xml. This adds /sitemap.xml as an alias
// of the URL list, because many tools look for that exact path.
const sitemapAlias = {
  name: 'sitemap-alias',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      try {
        await copyFile(fileURLToPath(new URL('sitemap-0.xml', dir)), fileURLToPath(new URL('sitemap.xml', dir)));
      } catch (error) {
        // No sitemap when there are no pages yet. Anything else is a real problem.
        if (error?.code !== 'ENOENT') throw error;
      }
    },
  },
};

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  compressHTML: true,
  build: {
    // /imprint is served from imprint.html by Netlify and Cloudflare Pages.
    format: 'file',
    // External stylesheet only, so the CSP needs no 'unsafe-inline' for styles.
    inlineStylesheets: 'never',
  },
  devToolbar: { enabled: false },
  integrations: [sitemap(), sitemapAlias],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline scripts or assets as data: URIs or inline <script> blocks (strict CSP).
      assetsInlineLimit: 0,
    },
  },
});
