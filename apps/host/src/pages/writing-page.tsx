import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { publishedWritingPosts } from '../content/writing';

export function WritingPage() {
  return (
    <div data-testid="writing-page" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="chrome-label text-primary">Writing</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Notes and essays
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Short writing on frontend architecture, platform thinking, and the decisions that make
            software easier to evolve.
          </p>
        </section>

        <section className="border-t border-border/60 pt-6">
          <div className="space-y-5">
            {publishedWritingPosts.map((post) => (
              <article key={post.slug} data-testid={`writing-post-card-${post.slug}`} className="space-y-2">
                <p className="text-sm text-muted-foreground">{post.date}</p>
                <h2 className="text-base font-medium text-foreground sm:text-lg">
                  <Link to={`/writing/${post.slug}`} className="transition-colors hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{post.summary}</p>
                <Link
                  to={`/writing/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                >
                  Read post
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
