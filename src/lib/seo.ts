export interface SocialImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Breadcrumb {
  name: string;
  path: string;
}

/** Canonicals never retain search parameters, hashes, or a trailing slash. */
export const canonicalUrl = (path: string, site: URL | string): string => {
  const url = new URL(path, site);
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
};

/** Escape CMS strings before placing serialized data inside a script element. */
export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c');

export const metaDescription = (value: string): string => {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}…`;
};
