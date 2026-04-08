import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, Panel } from '@playground/ui';
import { publishedWritingPosts } from '../content/writing';

export function WritingPage() {
  return (
    <div data-testid="writing-page" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <section className="terminal-panel terminal-panel--glow terminal-grid overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="primary">writing</Badge>
            <Badge tone="accent">{publishedWritingPosts.length} published</Badge>
          </div>

          <div className="space-y-4">
            <p className="chrome-label text-primary">Notes and essays</p>
            <h1 className="terminal-heading text-4xl text-foreground sm:text-5xl">Writing</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Short essays on frontend architecture, platform thinking, and the quieter decisions
              that make software easier to grow over time.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-5">
        {publishedWritingPosts.map((post) => (
          <article
            key={post.slug}
            data-testid={`writing-post-card-${post.slug}`}
            className="terminal-panel overflow-hidden p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="chrome-label">{post.date}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} tone="muted">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="terminal-heading text-2xl text-foreground">{post.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {post.summary}
                </p>
              </div>

              <Link
                to={`/writing/${post.slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Read post
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <Panel tone="quiet" className="mt-6 p-5 sm:p-6">
        <p className="chrome-label">Format note</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
          This section starts with a minimal file-backed setup inside the host app. If the writing
          grows more complex, the content model can grow with it.
        </p>
      </Panel>
    </div>
  );
}
