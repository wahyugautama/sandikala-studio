import { createClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET;

export const isSanityConfigured = Boolean(projectId && dataset);

// Imported only from Astro server/build code. No token is required for public content.
export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
      perspective: 'published',
      useCdn: false,
      timeout: 10_000,
      maxRetries: 2,
    })
  : null;
