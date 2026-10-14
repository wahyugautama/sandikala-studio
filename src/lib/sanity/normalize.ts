import type { Project, ProjectSummary } from '../../types/project';
import { isHttpUrl, normalizeImage } from './image';

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export const normalizeProjectSummary = (value: unknown): ProjectSummary | null => {
  const source = record(value);
  const id = text(source._id);
  const title = text(source.title) || text(source.clientName);
  const slug = text(source.slug);
  if (!id || /^(drafts|versions)\./.test(id) || !title || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(slug)) return null;
  return {
    _id: id,
    title,
    clientName: text(source.clientName) || title,
    slug,
    href: `/work/${encodeURIComponent(slug)}`,
    industry: text(source.industry),
    services: Array.isArray(source.services) ? [...new Set(source.services.map(text).filter(Boolean))] : [],
  };
};

export const normalizeProject = (value: unknown): Project | null => {
  const summary = normalizeProjectSummary(value);
  if (!summary) return null;
  const source = record(value);
  const seo = record(source.seo);
  const year = source.year;
  return {
    ...summary,
    year: typeof year === 'number' && Number.isInteger(year) && year >= 1000 && year <= 9999 ? year : undefined,
    projectUrl: isHttpUrl(source.projectUrl) ? source.projectUrl : undefined,
    projectOverview: text(source.projectOverview) || undefined,
    mainImage: normalizeImage(source.mainImage),
    imageGallery: (Array.isArray(source.imageGallery) ? source.imageGallery : [])
      .map(normalizeImage).filter((image) => image !== undefined),
    seo: {
      title: text(seo.title) || undefined,
      description: text(seo.description) || undefined,
      image: normalizeImage(seo.image),
    },
  };
};
