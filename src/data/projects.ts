import { sanityClient, urlFor } from '../lib/sanity';

export interface SanityImage {
  _key?: string;
  _type?: 'image';
  asset?: {
    _ref?: string;
    _type?: 'reference';
  };
  crop?: unknown;
  hotspot?: unknown;
  alt?: string;
  url?: string;
}

export interface PortfolioProject {
  _id: string;
  number: string;
  clientName: string;
  slug: string;
  href: string;
  mainImage: SanityImage;
  mainImageUrl: string;
  year: number;
  industry: string;
  services: string[];
  projectOverview: string;
  imageGallery?: SanityImage[];
  imageGalleryUrls: string[];
}

export type Project = PortfolioProject;

interface SanityProject {
  _id: string;
  clientName?: string;
  slug?: string;
  mainImage?: SanityImage;
  year?: number | string;
  industry?: string;
  services?: string[];
  projectOverview?: string;
  imageGallery?: SanityImage[];
}

interface FallbackProject {
  clientName: string;
  slug: string;
  mainImageUrl: string;
  year: number;
  industry: string;
  services: string[];
  projectOverview: string;
  imageGalleryUrls: string[];
}

const fallbackProjects: PortfolioProject[] = [
  {
    clientName: 'Adidas',
    slug: 'adidas',
    mainImageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=85',
    year: 2026,
    industry: 'Brand Experience',
    services: ['Creative Direction', 'Digital Design', 'Development'],
    projectOverview:
      'A digital experience exploring movement, performance, and modern athletic culture.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    clientName: 'Tribe Collective',
    slug: 'tribe-collective',
    mainImageUrl:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85',
    year: 2026,
    industry: 'Fashion & Culture',
    services: ['Art Direction', 'UX/UI Design', 'Web Development'],
    projectOverview:
      'A contemporary platform built around collective expression and independent culture.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    clientName: 'Nike Stride',
    slug: 'nike-stride',
    mainImageUrl:
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1800&q=85',
    year: 2025,
    industry: 'Digital Campaign',
    services: ['Experience Design', 'Interaction Design', 'Development'],
    projectOverview:
      'An energetic campaign experience centered on pace, rhythm, and personal progress.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    clientName: 'Monocle Radio',
    slug: 'monocle-radio',
    mainImageUrl:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1800&q=85',
    year: 2025,
    industry: 'Editorial Platform',
    services: ['UX Strategy', 'Digital Design', 'Development'],
    projectOverview:
      'A refined listening experience combining live radio, editorial stories, and global culture.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    clientName: "Arc'teryx",
    slug: 'arcteryx',
    mainImageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85',
    year: 2025,
    industry: 'Outdoor Experience',
    services: ['Creative Direction', 'Digital Design', 'Interaction'],
    projectOverview:
      'A product-led outdoor experience inspired by technical precision and extreme landscapes.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    clientName: 'New Balance',
    slug: 'new-balance',
    mainImageUrl:
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1800&q=85',
    year: 2024,
    industry: 'Product Storytelling',
    services: ['Art Direction', 'UX/UI Design', 'Development'],
    projectOverview:
      'A product story balancing performance heritage with a contemporary visual language.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    clientName: 'Studio Nicholson',
    slug: 'studio-nicholson',
    mainImageUrl:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85',
    year: 2024,
    industry: 'Fashion E-commerce',
    services: ['Digital Direction', 'UX/UI Design', 'Development'],
    projectOverview:
      'A quiet and editorial digital experience shaped by proportion, material, and movement.',
    imageGalleryUrls: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=85',
    ],
  },
].map((project, index) => createFallbackProject(project, index));

const projectsQuery = `*[_type == "project" && defined(slug.current)] | order(coalesce(year, 0) desc, _createdAt desc) {
  _id,
  "clientName": coalesce(clientName, client, title),
  "slug": slug.current,
  "mainImage": coalesce(mainImage, coverImage) {
    ...,
    alt
  },
  year,
  industry,
  services,
  "projectOverview": coalesce(projectOverview, summary),
  imageGallery[] {
    _key,
    _type,
    asset,
    crop,
    hotspot,
    alt
  }
}`;

function formatProjectNumber(index: number) {
  return String(index + 1).padStart(2, '0');
}

function createFallbackProject(project: FallbackProject, index: number): PortfolioProject {
  const mainImage: SanityImage = {
    alt: `${project.clientName} project image`,
    url: project.mainImageUrl,
  };

  const imageGallery = project.imageGalleryUrls.map((url, galleryIndex) => ({
    alt: `${project.clientName} gallery image ${galleryIndex + 1}`,
    url,
  }));

  return {
    _id: `fallback-${project.slug}`,
    number: formatProjectNumber(index),
    clientName: project.clientName,
    slug: project.slug,
    href: `/work/${project.slug}`,
    mainImage,
    mainImageUrl: project.mainImageUrl,
    year: project.year,
    industry: project.industry,
    services: project.services,
    projectOverview: project.projectOverview,
    imageGallery,
    imageGalleryUrls: project.imageGalleryUrls,
  };
}

function getFallbackProject(index: number) {
  return fallbackProjects[index % fallbackProjects.length];
}

function hasSanityAsset(image: SanityImage | undefined) {
  return Boolean(image?.asset?._ref);
}

function getImageUrl(image: SanityImage | undefined, fallbackUrl: string) {
  if (!image) {
    return fallbackUrl;
  }

  if (image.url) {
    return image.url;
  }

  if (!hasSanityAsset(image)) {
    return fallbackUrl;
  }

  return urlFor(image).width(1800).quality(85).auto('format').url();
}

function getGalleryUrls(images: SanityImage[] | undefined) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => getImageUrl(image, ''))
    .filter((url): url is string => Boolean(url));
}

function normalizeYear(year: SanityProject['year'], fallbackYear: number) {
  const numericYear = typeof year === 'string' ? Number.parseInt(year, 10) : year;
  return Number.isInteger(numericYear) ? Number(numericYear) : fallbackYear;
}

function mapSanityProject(project: SanityProject, index: number): PortfolioProject {
  const fallback = getFallbackProject(index);
  const slug = project.slug || fallback.slug;
  const hasMainImage = Boolean(project.mainImage?.url) || hasSanityAsset(project.mainImage);
  const mainImage = hasMainImage && project.mainImage ? project.mainImage : fallback.mainImage;
  const imageGallery = Array.isArray(project.imageGallery) ? project.imageGallery : [];

  return {
    _id: project._id,
    number: formatProjectNumber(index),
    clientName: project.clientName || fallback.clientName,
    slug,
    href: `/work/${slug}`,
    mainImage,
    mainImageUrl: getImageUrl(mainImage, fallback.mainImageUrl),
    year: normalizeYear(project.year, fallback.year),
    industry: project.industry || fallback.industry,
    services: Array.isArray(project.services) && project.services.length > 0 ? project.services : fallback.services,
    projectOverview: project.projectOverview || fallback.projectOverview,
    imageGallery,
    imageGalleryUrls: getGalleryUrls(imageGallery),
  };
}

async function getProjects(): Promise<PortfolioProject[]> {
  try {
    const sanityProjects = await sanityClient.fetch<SanityProject[]>(projectsQuery);

    if (!Array.isArray(sanityProjects) || sanityProjects.length === 0) {
      return fallbackProjects;
    }

    return sanityProjects.map(mapSanityProject);
  } catch (error) {
    console.warn('Unable to fetch Sanity projects. Using local fallback projects.', error);
    return fallbackProjects;
  }
}

export const projects = await getProjects();
