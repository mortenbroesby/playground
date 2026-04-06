# Roadmap

This file is the working list of ideas based on the repo as it exists today and the most believable directions it could grow into next.

## Where we are now

- The repo is a Turborepo monorepo with one deployable host app in [`apps/host`](../../apps/host) and one injected remote in [`packages/remotes/todo-app`](../../packages/remotes/todo-app).
- The host already proves the core microfrontend shape: route-level composition, a host-to-remote contract, and a place to grow more surfaces without splitting deployment yet.
- Shared packages for UI, types, and config are in place, which means the foundation is already better than a throwaway sandbox.
- The repo is also hinting at a personal-site direction through the host app, the existing `/uses` content, and the broader “playground” framing in the README.

## What feels closest

- Turn the host into a clearer personal product shell: `About`, `Uses`, `Projects`, and `Experiments` can all live there without fighting the current structure.
- Add one or two more remotes that prove the pattern on something meaningfully different from todos.
- Tighten the shared design layer so the host and remotes feel intentional instead of merely compatible.
- Treat the app launcher as the core navigation metaphor and make each surface feel like a deliberate module rather than a demo page.
- Improve integration coverage around host and remote boundaries so future experiments stay cheap to change.

## Next ideas

- Personal site pivot: make the host the public-facing site and use remotes as project surfaces, interactive essays, or demos.
- Project showcase system: each project gets a compact entry point in the shell and can expand into its own richer module when warranted.
- Content workflow: move from hard-coded content toward markdown or MDX-backed writing, changelog notes, and project pages.
- Design system pass: formalize layout, navigation, surface, and status primitives so new screens inherit a stronger default quality bar.
- Host dashboard polish: turn the shell into something that feels like a real product front door, not just a container for routes.

## Bigger swings

- Multi-remote playground: use the repo as a testbed for several remotes with different responsibilities, not just one todo example.
- “Uses” plus “Workbench” model: split the public personal-site content from a more experimental logged-in or power-user area later.
- Plugin or tools showcase: use the shell as a hub for internal utilities, AI-assisted workflows, or thin micro-apps that would otherwise become scattered repos.
- Live collaboration ideas: add realtime state or event streams once there is a stronger reason than “because WebSockets exist”.

## Suggested order

- First, sharpen the host into a more opinionated home for personal content and experiments.
- Next, add a second remote to validate whether the current microfrontend contract still feels good.
- Then, improve shared UI primitives and testing so the repo can scale without getting fragile.
- After that, decide whether this repo wants to be mostly a personal site, mostly a microfrontend lab, or intentionally both.

## Notes worth keeping in mind

- The current repo is strongest when experiments stay grounded in real surfaces, not abstract architecture.
- A good next step should either deepen the personal-site story or prove the microfrontend model on another real feature.
- The `docs/superpowers` area is already doing a different job, so this roadmap should stay lightweight and directional.
