const publishedProjects = `*[
  _type == "project" && defined(slug.current) &&
  !(_id in path("drafts.**")) && !(_id in path("versions.**"))
] | order(year desc, _createdAt desc, _id asc)`;

const summaryFields = `
  _id,
  "title": coalesce(title, clientName, client),
  "clientName": coalesce(clientName, client, title),
  "slug": slug.current,
  industry,
  services
`;

const imageFields = `
  "url": asset->url,
  "alt": coalesce(alt, ""),
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
`;

// Listing pages don't download galleries or case-study metadata.
export const projectSummariesQuery = `${publishedProjects} { ${summaryFields} }`;

export const projectsQuery = `${publishedProjects} {
  ${summaryFields},
  year,
  projectUrl,
  "projectOverview": coalesce(projectOverview, summary),
  "mainImage": coalesce(mainImage, coverImage) { ${imageFields} },
  "imageGallery": coalesce(imageGallery, [])[] { ${imageFields} },
  seo { title, description, "image": image { ${imageFields} } }
}`;
