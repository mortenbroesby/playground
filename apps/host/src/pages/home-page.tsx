import { Link } from 'react-router-dom';
import { PageMetadata } from '../components/page-metadata';
import { PublicPage } from '../components/public-page';
import { publishedWritingPosts } from '../content/writing';

const featuredPosts = publishedWritingPosts.slice(0, 2);
const profileImageHref = 'https://github.com/mortenbroesby.png';

export function HomePage() {
  return (
    <>
      <PageMetadata
        title="Morten Broesby-Olsen"
        description="Frontend architect building product systems that can keep growing without becoming harder to work on."
        pathname="/"
      />
      <PublicPage testId="home-page">
          <section className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-start">
            <div className="space-y-4">
              <p className="chrome-label text-primary">personal site</p>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Hi, I&apos;m Morten.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-foreground">
                  I build frontend systems for products that need to keep growing without becoming
                  harder to work on.
                </p>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  I work across web, mobile, and TV, write now and then, and keep a separate
                  playground for ideas and experiments that do not belong on the main site.
                </p>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  I&apos;m also a husband, a father, and interested in how people build and learn.
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
            </div>

            <div className="mx-auto w-32 rounded-full border border-border/40 bg-muted/10 p-1 sm:mx-0 sm:justify-self-end">
              <img
                src={profileImageHref}
                alt="Portrait of Morten Broesby-Olsen"
                className="aspect-square w-full rounded-full object-cover [mask-image:radial-gradient(circle,black_62%,transparent_82%)]"
                loading="eager"
              />
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
