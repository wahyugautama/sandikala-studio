import { isSanityConfigured, sanityClient } from '../lib/sanity/client';
import { projectsQuery, projectSummariesQuery } from '../lib/sanity/queries';
import { normalizeProject, normalizeProjectSummary } from '../lib/sanity/normalize';
import type { Project, ProjectSummary } from '../types/project';

export type { Project } from '../types/project';

const allowDemo = import.meta.env.DEV || import.meta.env.SANITY_ALLOW_DEMO_CONTENT === 'true';

const fetchProjects = async <T extends ProjectSummary>(
  query: string,
  normalize: (value: unknown) => T | null,
): Promise<T[]> => {
  try {
    if (!isSanityConfigured || !sanityClient) throw new Error('Sanity project ID and dataset must be configured.');
    const source: unknown = await sanityClient.fetch(query);
    if (!Array.isArray(source)) throw new Error('Sanity returned an invalid project response.');

    const slugs = new Set<string>();
    const projects: T[] = [];
    for (const value of source) {
      const project = normalize(value);
      if (!project) {
        console.warn('Skipping a published project with a missing title or invalid slug.');
        continue;
      }
      if (slugs.has(project.slug)) throw new Error(`Duplicate project slug: ${project.slug}`);
      slugs.add(project.slug);
      projects.push(project);
    }
    // An empty published dataset is valid; never replace it with fictional work.
    if (source.length && !projects.length) throw new Error('No published projects have valid titles and slugs.');
    return projects;
  } catch (error) {
    if (!allowDemo) {
      throw new Error('Unable to build published Sanity content. Check configuration, network access, and project slugs. The existing deployment should remain live.', { cause: error });
    }
    console.warn('Sanity unavailable. Using local demo projects for development.');
    const { fallbackProjects } = await import('./demo-projects');
    return fallbackProjects.map(normalize).filter((project): project is T => project !== null);
  }
};

// Share build requests, but let development reloads fetch current CMS content.
let projectsPromise: Promise<Project[]> | undefined;
let summariesPromise: Promise<ProjectSummary[]> | undefined;

export const getProjects = (): Promise<Project[]> => {
  if (import.meta.env.DEV) return fetchProjects(projectsQuery, normalizeProject);
  return projectsPromise ??= fetchProjects(projectsQuery, normalizeProject);
};

export const getProjectSummaries = (): Promise<ProjectSummary[]> => {
  if (import.meta.env.DEV) return fetchProjects(projectSummariesQuery, normalizeProjectSummary);
  return summariesPromise ??= fetchProjects(projectSummariesQuery, normalizeProjectSummary);
};
