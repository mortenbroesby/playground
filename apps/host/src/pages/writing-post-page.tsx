import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Panel } from '@playground/ui';
import { getWritingPostBySlug } from '../content/writing';

export function WritingPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getWritingPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div
        data-testid="writing-post-not-found"
        className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6"
      >
        <Panel className="p-6 sm:p-8">
          <p className="chrome-label text-primary">Writing</p>
          <h1 className="terminal-heading mt-3 text-3xl text-foreground">Post not found</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            That writing entry is not available. Head back to the index and choose another post.
          </p>
          <Link
            to="/writing"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to writing
          </Link>
        </Panel>
      </div>
    );
  }

  return (
    <div
      data-testid="writing-post-page"
      className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6"
    >
      <article className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary">writing</Badge>
            {post.tags.map((tag) => (
              <Badge key={tag} tone="muted">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            <p className="chrome-label text-primary">{post.date}</p>
            <h1 className="terminal-heading text-4xl text-foreground sm:text-5xl">{post.title}</h1>
            <p
              data-testid="writing-post-summary"
              className="text-base leading-7 text-muted-foreground sm:text-lg"
            >
              {post.summary}
            </p>
          </div>

          <div data-testid="writing-post-body" className="space-y-4">
            {post.body.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8 text-foreground/95">
                {paragraph}
              </p>
            ))}
          </div>

          <Link
            to="/writing"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to writing
          </Link>
        </div>
      </article>
    </div>
  );
}
