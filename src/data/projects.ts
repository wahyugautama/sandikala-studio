export interface ProjectImage { url: string; alt: string }

export interface PortfolioProject {
  _id: string;
  number: string;
  clientName: string;
  slug: string;
  href: string;
  mainImage: ProjectImage;
  mainImageUrl: string;
  year: number;
  industry: string;
  services: string[];
  projectOverview: string;
  context?: string;
  approach?: string;
  outcome?: string;
  testimonial?: string;
  testimonialAuthor?: string;
  imageGallery: ProjectImage[];
  imageGalleryUrls: string[];
}

export type Project = PortfolioProject;
type StaticProject = Omit<PortfolioProject, '_id' | 'number' | 'href' | 'mainImage' | 'imageGalleryUrls'>;

const staticProjects: StaticProject[] = [
  {
    clientName: 'North House', slug: 'north-house', year: 2026, industry: 'Architecture',
    services: ['Art Direction', 'Digital Design', 'Development'],
    mainImageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2000&q=88',
    projectOverview: 'A restrained digital identity for a contemporary residential architecture practice.',
    context: 'North House needed a calmer and more editorial way to present its residential portfolio.',
    approach: 'The system uses generous scale, direct project navigation, and photography-led layouts.',
    outcome: 'A focused portfolio that keeps the architecture at the center of the experience.',
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
    context: 'Forma needed a digital shop that felt closer to a design publication than a conventional catalogue.',
    approach: 'Product details and atmospheric photography are arranged in a quiet modular system.',
    outcome: 'A flexible storefront with a more distinctive and tactile visual rhythm.',
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
    context: 'Field Notes required a structure that could hold long-form stories without losing visual impact.',
    approach: 'The experience combines cinematic imagery with compact editorial typography.',
    outcome: 'A publishing system that moves naturally between photography, essays, and field guides.',
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
    context: 'Aperture wanted the website to disappear behind the work while retaining a recognizable voice.',
    approach: 'Minimal controls and strong sequencing let each photographic series set its own pace.',
    outcome: 'A fast, adaptable archive designed around image quality and direct navigation.',
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
    context: 'Common Ground needed a storefront that could shift tone across collections without losing clarity.',
    approach: 'A neutral interface supports expressive campaigns, product stories, and concise commerce flows.',
    outcome: 'A more editorial shopping experience with a consistent underlying system.',
    imageGallery: [
      { url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=86', alt: 'Fashion retail display' },
      { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=86', alt: 'Editorial fashion portrait' },
    ],
  },
];

export const projects: PortfolioProject[] = staticProjects.map((project, index) => ({
  ...project,
  _id: `static-${project.slug}`,
  number: String(index + 1).padStart(2, '0'),
  href: `/work/${project.slug}`,
  mainImage: { url: project.mainImageUrl, alt: `${project.clientName} project image` },
  imageGalleryUrls: project.imageGallery.map((image) => image.url),
}));
