import type { ProjectImage } from '../../types/project';

export const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const normalizeImage = (value: unknown): ProjectImage | undefined => {
  if (!value || typeof value !== 'object') return;
  const image = value as Record<string, unknown>;
  if (!isHttpUrl(image.url)) return;
  const url = new URL(image.url);
  const dimensions = url.hostname === 'cdn.sanity.io' ? url.pathname.match(/-(\d+)x(\d+)\.[a-z]+$/i) : null;
  const width = Number(image.width ?? dimensions?.[1]);
  const height = Number(image.height ?? dimensions?.[2]);
  const hasDimensions = Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0;
  return {
    url: image.url,
    alt: typeof image.alt === 'string' ? image.alt.trim() : '',
    ...(hasDimensions ? { width, height } : {}),
  };
};

/** Width-only transforms preserve the existing gallery's uncropped aspect ratios. */
export const imageUrl = (image: ProjectImage, width: number): string => {
  const url = new URL(image.url);
  if (!['cdn.sanity.io', 'images.unsplash.com'].includes(url.hostname)) return image.url;
  url.searchParams.set('w', String(Math.min(width, image.width ?? width)));
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'max');
  url.searchParams.set('q', '82');
  return url.href;
};

export const responsiveImage = (image: ProjectImage) => {
  const supported = ['cdn.sanity.io', 'images.unsplash.com'].includes(new URL(image.url).hostname);
  const maximum = Math.min(image.width ?? 2400, 2400);
  const widths = [...new Set([480, 768, 1024, 1440, 1920, maximum].filter((width) => width <= maximum))].sort((a, b) => a - b);
  return {
    src: imageUrl(image, 1440),
    srcset: supported ? widths.map((width) => `${imageUrl(image, width)} ${width}w`).join(', ') : undefined,
    sizes: '(min-width: 1600px) 1520px, (min-width: 700px) 95.2vw, calc(100vw - 2rem)',
    width: image.width,
    height: image.height,
  };
};
