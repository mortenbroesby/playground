import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getWritingPostBySlug } from '@/domain/writing/writing';
import { PageMetadata } from '@/ui/PageMetadata/PageMetadata';

export function WritingPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getWritingPostBySlug(slug) : undefined;

  if (!post) {
    return (
      <div
        data-testid="writing-post-not-found"
        className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14"
      >
        <div className="space-y-4">
          <p className="chrome-label text-primary">Writing</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Post not found
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            That writing entry is not available. Head back to the index and choose another post.
          </p>
          <Link
            to="/writing"
            className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to writing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMetadata
        title={post.title}
        description={post.summary}
        type="article"
      />
    <div
      data-testid="writing-post-page"
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14"
    >
      <article className="space-y-8">
        <header className="space-y-4">
          <Link
            to="/writing"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to writing
          </Link>

          <div className="space-y-3">
            <p className="chrome-label text-primary">{post.date}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {post.title}
            </h1>
            <p
              data-testid="writing-post-summary"
              className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base"
            >
              {post.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </header>

        <div
          data-testid="writing-post-body"
          className="border-t border-border/60 pt-8"
        >
          <div className="writing-prose">
            <post.Content />
          </div>
        </div>
      </article>
    </div>
    </>
  );
}
