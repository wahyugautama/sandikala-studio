import type { PortfolioProject } from '../types/project';

type StaticProject = Omit<PortfolioProject, '_id' | 'title' | 'href' | 'mainImage'> & { mainImageUrl: string };

const staticProjects: StaticProject[] = [
  {
    clientName: 'North House', slug: 'north-house', year: 2026, industry: 'Architecture',
    services: ['Art Direction', 'Digital Design', 'Development'],
    mainImageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2000&q=88',
    projectOverview: 'A restrained digital identity for a contemporary residential architecture practice.',
    imageGallery: [
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=86', alt: 'Modern house exterior' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=86', alt: 'Contemporary residential architecture' },
    ],
  },
  {
    clientName: 'Forma Objects', slug: 'forma-objects', year: 2026, industry: 'Furniture & Objects',
    services: ['Creative Direction', 'E-commerce', 'Development'],
    mainImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=88',
    projectOverview: 'An image-led commerce experience for a collection of furniture and everyday objects.',
    imageGallery: [
      { url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1800&q=86', alt: 'Sculptural furniture interior' },
      { url: 'https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1800&q=86', alt: 'Minimal furniture collection' },
    ],
  },
  {
    clientName: 'Field Notes', slug: 'field-notes', year: 2025, industry: 'Travel & Culture',
    services: ['Editorial Design', 'UX Design', 'Development'],
    mainImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=88',
    projectOverview: 'A visual journal documenting remote places, local culture, and slow travel.',
    imageGallery: [
      { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=86', alt: 'Mountain landscape and lake' },
      { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=86', alt: 'Remote natural landscape' },
    ],
  },
  {
    clientName: 'Aperture', slug: 'aperture', year: 2025, industry: 'Photography',
    services: ['Brand System', 'Portfolio Design', 'Development'],
    mainImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2000&q=88',
    projectOverview: 'A precise portfolio system for a photography studio working across art and commerce.',
    imageGallery: [
      { url: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1800&q=86', alt: 'Camera and photographic equipment' },
      { url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1800&q=86', alt: 'Photographer working outdoors' },
    ],
  },
  {
    clientName: 'Common Ground', slug: 'common-ground', year: 2024, industry: 'Fashion & Retail',
    services: ['Art Direction', 'Digital Design', 'E-commerce'],
    mainImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=88',
    projectOverview: 'A flexible retail platform balancing seasonal campaigns with a permanent product archive.',
    imageGallery: [
      { url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=86', alt: 'Fashion retail display' },
      { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=86', alt: 'Editorial fashion portrait' },
    ],
  },
];

export const fallbackProjects: PortfolioProject[] = staticProjects.map(({ mainImageUrl, ...project }) => ({
  ...project,
  _id: `static-${project.slug}`,
  title: project.clientName,
  href: `/work/${project.slug}`,
  mainImage: { url: mainImageUrl, alt: `${project.clientName} project image` },
}));

