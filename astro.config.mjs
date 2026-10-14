// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './src/config/site.ts';

// Plain HTML + CSS — no Tailwind, no UI framework. Styling lives in
// src/styles/main.css as class-based rules. https://astro.build/config
export default defineConfig({
  site: siteConfig.url,
  output: 'static',
  trailingSlash: 'never',
  // Preserve Astro 5's whitespace behavior across the compiler upgrade.
  compressHTML: true,
  integrations: [sitemap({
    filter: (page) => {
      const path = new URL(page).pathname.replace(/\/$/, '') || '/';
      return !['/404', '/style-guide', '/works', '/work', '/studio', '/services', '/process', '/contact'].includes(path);
    },
  })],
  redirects: {
    '/works': '/#info',
    '/work': '/#info',
    '/studio': '/about',
    '/services': '/about#services-title',
    '/process': '/about',
    '/contact': '/about#contact',
  },
});
