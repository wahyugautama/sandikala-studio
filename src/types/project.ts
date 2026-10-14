export interface ProjectImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProjectSummary {
  _id: string;
  title: string;
  clientName: string;
  slug: string;
  href: string;
  industry: string;
  services: string[];
}

export interface PortfolioProject extends ProjectSummary {
  mainImage?: ProjectImage;
  year?: number;
  projectUrl?: string;
  projectOverview?: string;
  imageGallery: ProjectImage[];
  seo?: { title?: string; description?: string; image?: ProjectImage };
}

export type Project = PortfolioProject;
