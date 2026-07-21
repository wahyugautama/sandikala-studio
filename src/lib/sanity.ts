import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

export const sanityConfig = {
  projectId: import.meta.env.SANITY_PROJECT_ID || 'afu5jgjq',
  dataset: import.meta.env.SANITY_DATASET || 'portfolio',
  apiVersion: import.meta.env.SANITY_API_VERSION || '2025-01-01',
  useCdn: true,
};

export const sanityClient = createClient(sanityConfig);

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}
