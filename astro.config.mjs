// @ts-check
import { defineConfig } from 'astro/config';

// Plain HTML + CSS — no Tailwind, no UI framework. Styling lives in
// src/styles/main.css as class-based rules. https://astro.build/config
export default defineConfig({
  redirects: {
    '/works': '/#work',
    '/work': '/#work',
    '/about': '/#studio',
    '/studio': '/#studio',
    '/services': '/#capabilities',
    '/process': '/#process',
    '/contact': '/#contact',
  },
});
