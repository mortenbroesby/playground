import { Link } from 'react-router-dom';
import { publishedWritingPosts } from '@/domain/writing/writing';
import { PageMetadata } from '@/ui/PageMetadata/PageMetadata';
import { PublicPage } from '@/ui/primitives/public-page';

const featuredPosts = publishedWritingPosts.slice(0, 2);

const quickLinks = [
  { href: '/about', label: 'About' },
  { href: '/writing', label: 'Writing' },
  { href: '/uses', label: 'Uses' },
  { href: '/playground', label: 'Playground' },
] as const;

export function HomePage() {
  return (
    <>
      <PageMetadata
        title="Morten Broesby-Olsen"
        description="Frontend architect and engineer. I build frontend systems, write occasionally, and keep a separate playground for ideas."
      />
      <PublicPage testId="home-page">
        <section className="space-y-4">
          <p className="chrome-label text-primary">personal site</p>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Hi, I&apos;m Morten.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-foreground">
              I build frontend systems, write occasionally, and keep a separate playground for
              ideas that do not belong on the main site.
            </p>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Start here if you want the shortest version.
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
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
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
      </PublicPage>
    </>
  );
}
