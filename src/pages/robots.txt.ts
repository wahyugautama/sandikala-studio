import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const noindex = import.meta.env.SITE_NOINDEX === 'true' || process.env.VERCEL_ENV === 'preview';
  return new Response(
    `User-agent: *\n${noindex ? 'Disallow: /' : 'Allow: /'}\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
