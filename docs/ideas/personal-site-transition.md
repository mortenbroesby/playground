# Personal Site Transition

Plan for evolving the current host into a calmer personal website while preserving the playground as a distinct place for apps, experiments, and odd ideas.

Host execution details live in [`host-migration-checklist.md`](./host-migration-checklist.md).

## Intent

- Make the public site feel more like a personal home on the web than an operations shell.
- Keep the playground alive as a growing suite of apps and experiments.
- Separate personal/editorial pages from experiments without forcing a second deployable app yet.
- Add a lightweight writing workflow so posts and notes can ship without hard-coding every page.

## What the references suggest

- [`morten.broesby.dk`](https://morten.broesby.dk/) has the right simplicity: clear personal intro, light navigation, and room for writing.
- [`addyosmani.com`](https://addyosmani.com/) has the right breadth: one personal front door that fans out into writing, work, projects, and references without feeling fragmented.
- The current host already has useful primitives for a split model: public pages like `About` and `Uses`, plus a separate `Playground` route and app surfaces.

## Product decision

Do not wrap the playground in another app right now.

Instead:

- Keep one host application and one deployment.
- Treat the site as two modes inside that host:
  - the public personal site
  - the playground section
- Give `/playground` its own tone, local navigation, and directory of apps so it feels separate without adding routing and deployment overhead too early.

This keeps the architecture simple while still creating a clear mental boundary for visitors.

## Target structure

Recommended top-level routes:

- `/` home
- `/about`
- `/writing`
- `/writing/:slug`
- `/uses`
- `/playground`
- `/playground/:app`

Optional later:

- `/projects`
- `/now`
- `/playground/tags/:tag`

## How each area should behave

### Home

Purpose:

- Introduce Morten quickly
- Show current focus
- Pull people toward writing, about, and playground

Recommended content:

- short intro
- one-paragraph positioning statement
- selected writing
- selected playground apps or experiments
- lightweight links to GitHub, LinkedIn, and other relevant profiles

Tone:

- quieter and more relaxed than the current hacker shell
- more editorial than dashboard-like

### About

Purpose:

- give the fuller personal and professional story
- explain working style, values, and interests

Shift the current route away from:

- system labels
- metrics for their own sake
- terminal framing as the primary identity

Keep:

- bio
- values
- inspirations
- links

Add:

- narrative sections
- timeline or selected career highlights
- a short section on why the playground exists

### Writing

Purpose:

- be the home for essays, notes, and occasional posts

Content model:

- longer essays
- shorter notes
- optional snippets later, only if there is enough material to justify the split

Implementation direction:

- move to file-backed content, starting with the lowest-friction option that fits the current host stack
- keep metadata minimal: `title`, `slug`, `summary`, `date`, `tags`, `published`
- support featured posts on the home page

Recommended rollout:

- start with a simple file-backed model that does not require a heavy content system
- prefer markdown plus a small metadata index, or TypeScript-backed post modules, before introducing MDX
- add MDX only if rich embedded components become a real need

### Playground

Purpose:

- hold eclectic ideas, micro-apps, visual experiments, and exploratory builds
- make it obvious that not every experiment has the same aesthetic or theme

Important framing:

- the playground is a section of the personal site, not the identity of the whole site
- some playground apps can be hacker-flavoured, others can be calm, playful, weird, or practical

Recommended structure:

- `/playground` becomes an index page with a short manifesto and app directory
- each app gets a card with status, short description, and link
- app pages can keep stronger local visual identity than the rest of the site

## Navigation model

Replace the current app-matrix framing in the global shell with a simpler site navigation.

Recommended primary nav:

- Home
- About
- Writing
- Uses
- Playground

Recommended secondary navigation inside playground only:

- Overview
- Apps
- Visual experiments
- Archive or notes later if needed

Move current internal/demo surfaces like `System`, `Todo`, and `Uplink` out of the main public nav and under playground-specific navigation or labels.

## Visual direction

Current state:

- the host feels like an operations dashboard
- labels like `playground`, `operations shell`, and route status codes dominate the tone

Target state:

- the main site should feel more personal, composed, and editorial
- the playground should feel more modular and exploratory

Practical design guidance:

- keep the sharp quality bar and clean structure
- reduce system chrome on public pages
- use more whitespace and stronger typography on home, about, and writing
- keep writing detail pages firmly in the public/editorial language, not the playground language
- reserve dense UI chrome, status indicators, and hacker motifs for playground pages that genuinely benefit from them

## Architecture approach

Keep the current host-owned routing model and evolve it in place.

Recommended implementation shape:

1. Introduce a public-site layout for `/`, `/about`, `/writing`, and `/uses`.
2. Introduce a playground layout for `/playground` and playground app routes.
3. Keep remotes as playground features unless there is a strong reason for a public page to be remote-backed.
4. Add a minimal content layer for writing before adding more route complexity.

This keeps the host responsible for composition while preserving room for more remotes over time.

## Rollout phases

### Phase 1: Reframe the shell

- Rename the site-level branding away from `playground` as the primary label.
- Replace app-matrix navigation with site navigation.
- Make `/` a real home page instead of redirecting to `/about`.
- Keep `/playground` as a visible top-level destination.

### Phase 2: Establish content pages

- Refine `About` into a more narrative page.
- Keep `Uses` but align it visually with the calmer public-site tone.
- Add a `Writing` index page and one or two seed posts.

### Phase 3: Separate playground properly

- Turn `/playground` into a directory page instead of a single visual demo.
- Nest current experiments and apps under playground-specific routes.
- Reposition `Todo`, `Uplink`, and future apps as entries in that directory.

### Phase 4: Expand the system

- Add more playground apps over time.
- Let some apps have their own stronger visual language.
- Add tagging, archive views, or project cross-links only when there is enough content to justify them.

## Non-goals for now

- creating a second wrapper app around the playground
- introducing a second deployment only for separation
- forcing every experiment into the same hacker theme
- building a complex CMS before the writing habit exists

## Success criteria

This transition is successful when:

- the homepage reads immediately as a personal website
- writing is a first-class part of the site
- the playground feels clearly separate from the personal/editorial pages
- new apps can be added to the playground without reshaping the public site
- the site no longer feels like the entire personal brand is a hacker-themed shell

## Immediate next steps

1. Redesign the route map and shell around `Home`, `About`, `Writing`, `Uses`, and `Playground`.
2. Replace the current global header and sidebar language with personal-site language.
3. Define the first MDX content model for writing.
4. Convert `/playground` into an index for apps and experiments.
5. Move current demo routes under the playground section.
