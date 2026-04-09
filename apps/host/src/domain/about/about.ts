export type SocialLink = {
  label: string;
  href: string;
  handle: string;
};

export const aboutPage = {
  headline: 'About',
  tagline: 'Frontend architect for product teams that need software to keep scaling without turning brittle.',
  bio: 'I have spent more than ten years building frontend systems across web, mobile, and Smart TV for products including HBO Max, Disney Life, Videoland, TV 2 PLAY, Pleo, and Danske Bank. The work I enjoy most sits between architecture, platform thinking, and the practical reality of helping teams ship.',
  pitch:
    'My focus is usually the same: make the frontend easier to reason about, easier to contribute to, and more dependable as the product and team grow.',
  whatIDo: [
    'Shape frontend architecture that stays legible as the product surface expands.',
    'Improve developer experience so shipping gets faster, calmer, and more consistent.',
    'Build shared systems across web, mobile, and TV without forcing every platform into the same mold.',
  ],
  teamsGet: [
    'Clearer structure, boundaries, and ownership across the frontend stack.',
    'Pragmatic standards that help teams move without slowing them down.',
    'A stronger platform foundation for product work that needs to keep evolving over years, not months.',
  ],
  socials: [
    {
      label: 'GitHub',
      href: 'https://github.com/mortenbroesby',
      handle: '@mortenbroesby',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/morten-broesby-olsen/',
      handle: 'morten-broesby-olsen',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/mortenbroesby/',
      handle: '@mortenbroesby',
    },
  ] satisfies SocialLink[],
  hobbies: [
    'Building side projects and design-system playgrounds',
    'Exploring AI-native developer workflows and tooling',
    'Streaming, recording, and experimenting with creator setups',
    'Following games, interfaces, and interactive systems',
    'Collecting better ways to work, plan, and stay organized',
  ],
  values: [
    'Clarity over cleverness',
    'Long-term maintainability',
    'Shared ownership',
    'Developer experience first',
  ],
  inspirations: [
    {
      label: 'Addy Osmani',
      href: 'https://addyosmani.com',
      note: 'Google Chrome DX, performance, engineering leadership',
    },
    {
      label: 'Lee Robinson',
      href: 'https://leerob.io',
      note: 'Vercel DX lead, Next.js, developer experience',
    },
    {
      label: 'Josh W Comeau',
      href: 'https://joshwcomeau.com',
      note: 'CSS, React, deep-dive teaching',
    },
    {
      label: 'Kent C. Dodds',
      href: 'https://kentcdodds.com',
      note: 'Testing, React, epic web',
    },
    {
      label: 'Sindre Sorhus',
      href: 'https://sindresorhus.com',
      note: 'OSS, Unix philosophy, craft',
    },
    {
      label: 'Theo (t3.gg)',
      href: 'https://t3.gg',
      note: 'TypeScript, full-stack, opinionated defaults',
    },
  ],
};
