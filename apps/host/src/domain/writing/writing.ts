import type { ComponentType } from 'react';

export type WritingPostMetadata = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
};

type WritingModule = {
  default: ComponentType;
  frontmatter: unknown;
};

export type WritingPost = WritingPostMetadata & {
  Content: ComponentType;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function toWritingPostMetadata(
  frontmatter: unknown,
  source: string,
): WritingPostMetadata {
  if (!frontmatter || typeof frontmatter !== 'object') {
    throw new Error(`Missing writing frontmatter in ${source}`);
  }

  const candidate = frontmatter as Partial<Record<keyof WritingPostMetadata, unknown>>;

  if (
    typeof candidate.slug !== 'string' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.summary !== 'string' ||
    typeof candidate.date !== 'string' ||
    typeof candidate.published !== 'boolean' ||
    !isStringArray(candidate.tags)
  ) {
    throw new Error(`Invalid writing frontmatter in ${source}`);
  }

  return {
    slug: candidate.slug,
    title: candidate.title,
    summary: candidate.summary,
    date: candidate.date,
    tags: candidate.tags,
    published: candidate.published,
  };
}

const writingModules = import.meta.glob<WritingModule>('./posts/*.mdx', {
  eager: true,
});

export const writingPosts: WritingPost[] = Object.entries(writingModules)
  .map(([source, module]) => ({
    ...toWritingPostMetadata(module.frontmatter, source),
    Content: module.default,
  }))
  .sort((left, right) => Date.parse(right.date) - Date.parse(left.date));

export const publishedWritingPosts = writingPosts.filter((post) => post.published);

export function getWritingPostBySlug(slug: string): WritingPost | undefined {
  return publishedWritingPosts.find((post) => post.slug === slug);
}
