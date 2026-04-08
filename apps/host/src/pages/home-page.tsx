import { Link } from 'react-router-dom';
import { publishedWritingPosts } from '../content/writing';

const featuredPosts = publishedWritingPosts.slice(0, 2);

export function HomePage() {
  return (
    <div data-testid="home-page" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="space-y-8">
        <section className="space-y-4">
          <p className="chrome-label text-primary">personal site</p>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Hi, I&apos;m Morten.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-foreground">
              I build frontend systems, write now and then, and keep a separate playground for
              ideas, experiments, and smaller apps.
            </p>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              This is the quieter side of the site. The playground is where experiments and more
              eclectic ideas live.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
            <Link to="/about" className="transition-colors hover:text-primary">
              Read the about page
            </Link>
            <Link to="/writing" className="transition-colors hover:text-primary">
              Open writing
            </Link>
          </div>
        </section>

        <section className="border-t border-border/60 pt-6">
          <div className="space-y-4">
            <div>
              <p className="chrome-label text-primary">Selected writing</p>
              <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                A few recent notes
              </h2>
            </div>

            <div className="space-y-4">
              {featuredPosts.map((post) => (
                <article key={post.slug} data-testid={`home-writing-${post.slug}`} className="space-y-2">
                  <p className="text-sm text-muted-foreground">{post.date}</p>
                  <h3 className="text-sm font-medium text-foreground sm:text-base">
                    <Link to={`/writing/${post.slug}`} className="transition-colors hover:text-primary">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">{post.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">Playground</p>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              The playground stays separate on purpose. It is where more eclectic app ideas, visual
              studies, and interaction experiments can live without making the main site feel busy.
            </p>
            <Link to="/playground" className="inline-flex text-sm text-foreground transition-colors hover:text-primary">
              Visit the playground
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
