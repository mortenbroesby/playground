export type WritingPost = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
  body: string[];
};

export const writingPosts: WritingPost[] = [
  {
    slug: 'steady-interfaces',
    title: 'Steady Interfaces for Growing Frontend Systems',
    summary:
      'A note on keeping products understandable as teams, routes, and responsibilities expand over time.',
    date: 'April 8, 2026',
    tags: ['frontend', 'architecture', 'platform'],
    published: true,
    body: [
      'The longer I work on frontend systems, the less interested I become in novelty for its own sake. What matters more is whether a surface stays legible when the team changes, the feature set grows, and the original intent starts to blur.',
      'That usually means creating stronger seams: route boundaries that make sense, components that do one clear job, and shared primitives that reduce drift instead of enforcing sameness. A system should be able to absorb new work without turning every addition into a negotiation with the whole codebase.',
      'This playground is useful precisely because it lets me test those seams in public. Some ideas end up as product-facing patterns, some stay experiments, but the shared lesson is the same: calm structures scale better than clever ones.',
    ],
  },
  {
    slug: 'why-keep-a-playground',
    title: 'Why Keep a Playground Inside a Personal Site',
    summary:
      'On separating experiments from identity without pretending side projects live outside the rest of your work.',
    date: 'April 8, 2026',
    tags: ['writing', 'playground', 'process'],
    published: true,
    body: [
      'I do not want the entire site to feel like one big demo shell, but I also do not want to hide the experimental side of my work. A playground solves that if it is framed correctly: it becomes a distinct section, not the entire personality of the site.',
      'That separation matters. Public pages should be calmer and easier to read. The playground can be denser, stranger, more provisional, and more visually varied. The point is not to make every experiment look like part of one polished brand story. The point is to give unfinished or evolving ideas a home.',
      'Over time, some of those ideas will turn into proper apps, essays, or reusable patterns. Others will stay one-off sketches. Keeping them close makes the site feel more honest, and it keeps the line between thinking and building pleasantly short.',
    ],
  },
];

export const publishedWritingPosts = writingPosts.filter((post) => post.published);

export function getWritingPostBySlug(slug: string): WritingPost | undefined {
  return publishedWritingPosts.find((post) => post.slug === slug);
}
