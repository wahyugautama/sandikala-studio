import { sanityClient, urlFor } from '../lib/sanity';

export interface Project {
  number: string;
  title: string;
  slug: string;
  href: string;
  image: string;
  year: string;
  category: string;
  services: string[];
  intro: string;
  description: string;
  gallery: string[];
  body?: unknown[];
  client?: string;
  featured?: boolean;
}

interface SanityProject {
  _id: string;
  title?: string;
  slug?: {
    current?: string;
  };
  client?: string;
  year?: number | string;
  industry?: string;
  services?: string[];
  coverImage?: unknown;
  summary?: string;
  body?: unknown[];
  featured?: boolean;
}

const fallbackProjects: Project[] = [
  {
    number: '01',
    title: 'Adidas',
    slug: 'adidas',
    href: '/work/adidas',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=85',
    year: '2026',
    category: 'Brand Experience',
    services: ['Creative Direction', 'Digital Design', 'Development'],
    intro:
      'A digital experience exploring movement, performance, and modern athletic culture.',
    description:
      'This is placeholder project copy. Structure the page so the content can later be replaced with real case-study material without rewriting the layout.',
    gallery: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    number: '02',
    title: 'Tribe Collective',
    slug: 'tribe-collective',
    href: '/work/tribe-collective',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85',
    year: '2026',
    category: 'Fashion & Culture',
    services: ['Art Direction', 'UX/UI Design', 'Web Development'],
    intro:
      'A contemporary platform built around collective expression and independent culture.',
    description: 'This is placeholder project copy for the Tribe Collective case study.',
    gallery: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    number: '03',
    title: 'Nike Stride',
    slug: 'nike-stride',
    href: '/work/nike-stride',
    image:
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1800&q=85',
    year: '2025',
    category: 'Digital Campaign',
    services: ['Experience Design', 'Interaction Design', 'Development'],
    intro:
      'An energetic campaign experience centered on pace, rhythm, and personal progress.',
    description: 'This is placeholder project copy for the Nike Stride case study.',
    gallery: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    number: '04',
    title: 'Monocle Radio',
    slug: 'monocle-radio',
    href: '/work/monocle-radio',
    image:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1800&q=85',
    year: '2025',
    category: 'Editorial Platform',
    services: ['UX Strategy', 'Digital Design', 'Development'],
    intro:
      'A refined listening experience combining live radio, editorial stories, and global culture.',
    description: 'This is placeholder project copy for the Monocle Radio case study.',
    gallery: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    number: '05',
    title: "Arc'teryx",
    slug: 'arcteryx',
    href: '/work/arcteryx',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85',
    year: '2025',
    category: 'Outdoor Experience',
    services: ['Creative Direction', 'Digital Design', 'Interaction'],
    intro:
      'A product-led outdoor experience inspired by technical precision and extreme landscapes.',
    description: "This is placeholder project copy for the Arc'teryx case study.",
    gallery: [
      'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    number: '06',
    title: 'New Balance',
    slug: 'new-balance',
    href: '/work/new-balance',
    image:
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1800&q=85',
    year: '2024',
    category: 'Product Storytelling',
    services: ['Art Direction', 'UX/UI Design', 'Development'],
    intro:
      'A product story balancing performance heritage with a contemporary visual language.',
    description: 'This is placeholder project copy for the New Balance case study.',
    gallery: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1800&q=85',
    ],
  },
  {
    number: '07',
    title: 'Studio Nicholson',
    slug: 'studio-nicholson',
    href: '/work/studio-nicholson',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85',
    year: '2024',
    category: 'Fashion E-commerce',
    services: ['Digital Direction', 'UX/UI Design', 'Development'],
    intro:
      'A quiet and editorial digital experience shaped by proportion, material, and movement.',
    description: 'This is placeholder project copy for the Studio Nicholson case study.',
    gallery: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=85',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=85',
    ],
  },
];

const projectsQuery = `*[_type == "project" && defined(slug.current)] | order(coalesce(year, 0) desc, _createdAt desc) {
  _id,
  title,
  slug,
  client,
  year,
  industry,
  services,
  coverImage,
  summary,
  body,
  featured
}`;

function formatProjectNumber(index: number) {
  return String(index + 1).padStart(2, '0');
}

function getFallbackProject(index: number) {
  return fallbackProjects[index % fallbackProjects.length];
}

function getImageUrl(project: SanityProject, fallback: Project) {
  if (!project.coverImage) {
    return fallback.image;
  }

  return urlFor(project.coverImage).width(1800).quality(85).auto('format').url();
}

function mapSanityProject(project: SanityProject, index: number): Project {
  const fallback = getFallbackProject(index);
  const slug = project.slug?.current || fallback.slug;
  const image = getImageUrl(project, fallback);

  return {
    number: formatProjectNumber(index),
    title: project.title || fallback.title,
    slug,
    href: `/work/${slug}`,
    image,
    year: project.year ? String(project.year) : fallback.year,
    category: project.industry || fallback.category,
    services: Array.isArray(project.services) && project.services.length > 0 ? project.services : fallback.services,
    intro: project.summary || fallback.intro,
    description: project.summary || fallback.description,
    gallery: [image],
    body: Array.isArray(project.body) ? project.body : undefined,
    client: project.client,
    featured: project.featured,
  };
}

async function getProjects(): Promise<Project[]> {
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
