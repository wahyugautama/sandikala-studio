# Sanity Project Content

The live Sanity Studio is maintained in a separate local repository at
`/Users/wahyugautama/portfolio-astro-sanity/website-portfolio`. Its existing
project schema is `schemaTypes/project.ts`. It connects to project `afu5jgjq`,
dataset `portfolio`, and is deployed at `https://wahyu-sanity-cms.sanity.studio/`.
The Sanity plugin in this Astro project does not contain the Studio schema.
Studio navigation and the global create menu list only Projects. The `post`
and `technology` schema types remain available for existing records and
project references.

The Studio project editor has `title`, `slug`, `client`, `year`, `projectUrl`,
`industry`, `services`, `technologies`, `coverImage`, `summary`, and
`imageGallery`. `year` is required and accepts integer values from 1000 to
9999. `projectUrl` is optional and accepts absolute HTTP or HTTPS URLs.

The Astro frontend queries projects in `src/data/projects.ts`. It uses the
Studio `title` for the case-study heading, maps `client` to `clientName`,
`coverImage` to `mainImage`, and `summary` to `projectOverview`. The case-study
page displays `year` and an external `projectUrl` link when present. It renders
`imageGallery` in its saved order, or uses `coverImage` when the gallery is
empty. With neither image field set, the page simply omits the gallery. Older
published documents without `year` or `projectUrl` still load; editors must
enter a year before republishing them. Local demo projects remain the fallback
if Sanity is unavailable.

Some published project documents still contain `body` and `featured`. Those
fields were removed from the Studio schema before this update, which explains
the "Unknown fields found" warning in the editor. The stored values have not
been deleted.
