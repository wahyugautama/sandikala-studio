# Sanity Project Content

This Astro project does not include a Sanity Studio configuration or schema files. The frontend expects the existing Sanity `project` document to use this canonical structure:

1. `clientName`
2. `slug`
3. `mainImage`
4. `year`
5. `industry`
6. `services`
7. `projectOverview`
8. `imageGallery`

Use this field order in the Studio project document schema:

```ts
import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'content', title: 'Project Content' },
    { name: 'gallery', title: 'Gallery' },
  ],
  fields: [
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      group: 'general',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'general',
      options: {
        source: 'clientName',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      group: 'general',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Describe the image for accessibility.',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'general',
      validation: (Rule) =>
        Rule.required()
          .integer()
          .min(1900)
          .max(new Date().getFullYear() + 1),
    }),
    defineField({
      name: 'industry',
      title: 'Industry',
      type: 'string',
      group: 'general',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      group: 'general',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'projectOverview',
      title: 'Project Overview',
      type: 'text',
      rows: 4,
      group: 'content',
      description: 'A short paragraph summarising the project.',
      validation: (Rule) => Rule.required().max(600),
    }),
    defineField({
      name: 'imageGallery',
      title: 'Image Gallery',
      type: 'array',
      group: 'gallery',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              description: 'Describe the image for accessibility.',
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      clientName: 'clientName',
      year: 'year',
      industry: 'industry',
      media: 'mainImage',
    },
    prepare({ clientName, year, industry, media }) {
      const details = [year, industry].filter(Boolean).join(' · ');

      return {
        title: clientName,
        subtitle: details,
        media,
      };
    },
  },
});
```

## Existing Content Migration

The frontend currently supports these temporary compatibility fallbacks:

- `mainImage` falls back to existing `coverImage`.
- `projectOverview` falls back to existing `summary`.
- `clientName` falls back to existing `client` or `title`.
- Missing or incomplete `services`, `mainImage`, and `projectOverview` fall back to local demo project data so the Astro build does not crash.

Before removing legacy fields from production documents, migrate existing data:

- `client` or `title` -> `clientName`
- `coverImage` -> `mainImage`
- `summary` -> `projectOverview`
- Keep `slug`, `year`, `industry`, and `services`
- Add `imageGallery` where needed

Do not delete legacy fields until the Studio schema has been deployed and project documents have been reviewed.
