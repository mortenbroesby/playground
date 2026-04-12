import { aboutPage } from '@/domain/about/about';
import { PageMetadata } from '@/ui/PageMetadata/PageMetadata';
import { PersonalPage } from '@/ui/primitives/personal-page';

const ABOUT_NAME = 'Morten Broesby-Olsen';

export function AboutPage() {
  return (
    <>
      <PageMetadata
        title="About"
        description={aboutPage.bio}
      />
      <PersonalPage testId="about-page">
        <section className="space-y-4">
          <p className="chrome-label text-primary">{aboutPage.headline}</p>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {ABOUT_NAME}
            </h1>
            <p className="text-sm leading-7 text-foreground sm:text-base">{aboutPage.tagline}</p>
            <p
              data-testid="about-bio"
              className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base"
            >
              {aboutPage.bio}
            </p>
            <p className="max-w-2xl text-sm leading-7 text-foreground">{aboutPage.pitch}</p>
          </div>
        </section>

        <section className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">What I do</p>
            <ul className="space-y-2 text-sm leading-7 text-foreground sm:text-base">
              {aboutPage.whatIDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">What teams get</p>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground sm:text-base">
              {aboutPage.teamsGet.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section data-testid="about-socials" className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">Elsewhere</p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-foreground">
              {aboutPage.socials.map((social) => (
                <a
                  key={social.label}
                  data-testid={`about-social-${social.label.toLowerCase()}`}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section data-testid="about-values" className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">How I work</p>
            <ul className="space-y-2 text-sm leading-7 text-foreground sm:text-base">
              {aboutPage.values.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          </div>
        </section>

        <section data-testid="about-hobbies" className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">Beyond the work</p>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground sm:text-base">
              {aboutPage.hobbies.map((hobby) => (
                <li key={hobby}>{hobby}</li>
              ))}
            </ul>
          </div>
        </section>

        <section data-testid="about-inspirations" className="border-t border-border/60 pt-6">
          <div className="space-y-3">
            <p className="chrome-label text-primary">Inspirations</p>
            <div className="space-y-4">
              {aboutPage.inspirations.map((person) => (
                <article key={person.label} className="space-y-2">
                  <a
                    href={person.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-foreground transition-colors hover:text-primary sm:text-base"
                  >
                    {person.label}
                  </a>
                  <p className="text-sm leading-6 text-muted-foreground">{person.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </PersonalPage>
    </>
  );
}
