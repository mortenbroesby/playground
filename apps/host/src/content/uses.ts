export type UsesItem = {
  label: string;
  href?: string;
  note?: string;
};

export type UsesSection = {
  title: string;
  items: UsesItem[];
};

export const aboutPage = {
  headline: 'About',
  tagline: 'Frontend architect. Platform engineer. Long-term thinker.',
  bio: 'I build reliable frontend platforms that scale across web, mobile, and Smart TV — with a focus on developer experience, shared ownership, and long-term maintainability. Ten-plus years in the industry working on products like HBO Max, Disney Life, Videoland, TV 2 PLAY, and Pleo WebCore.',
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

const sections: UsesSection[] = [
  {
    title: 'Editor & Shell',
    items: [
      { label: 'Cursor', href: 'https://cursor.com', note: 'AI-first editor' },
      { label: 'VS Code', href: 'https://code.visualstudio.com', note: 'fallback editor' },
      {
        label: 'Claude Code',
        href: 'https://www.anthropic.com/claude-code',
        note: 'agentic coding CLI',
      },
      { label: 'Warp', href: 'https://www.warp.dev', note: 'modern terminal with AI' },
      { label: 'Oh My ZSH', href: 'https://ohmyz.sh', note: 'zsh shell setup' },
      { label: 'iTerm2', href: 'https://iterm2.com', note: 'fallback terminal emulator' },
    ],
  },
  {
    title: 'VS Code / Cursor Extensions',
    items: [
      {
        label: 'GitLens',
        href: 'https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens',
      },
      {
        label: 'ESLint',
        href: 'https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint',
      },
      {
        label: 'Prettier',
        href: 'https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode',
      },
      {
        label: 'Peacock',
        href: 'https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock',
      },
      {
        label: 'Code Spell Checker',
        href: 'https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker',
      },
      {
        label: 'Path Intellisense',
        href: 'https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense',
      },
      {
        label: 'Error Lens',
        href: 'https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens',
      },
      {
        label: 'TODO Highlight',
        href: 'https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight',
      },
    ],
  },
  {
    title: 'Software',
    items: [
      { label: 'Arc', href: 'https://arc.net', note: 'browser, daily driver' },
      {
        label: 'Raycast',
        href: 'https://www.raycast.com',
        note: 'launcher + AI, replaces Alfred',
      },
      {
        label: '1Password',
        href: 'https://1password.com',
        note: 'password manager',
      },
      {
        label: 'Rectangle',
        href: 'https://rectangleapp.com',
        note: 'Mac window management',
      },
      {
        label: 'OBS Studio',
        href: 'https://obsproject.com',
        note: 'streaming and recordings',
      },
      { label: 'Notion', href: 'https://www.notion.so', note: 'notes and planning' },
      { label: 'Spotify', href: 'https://www.spotify.com', note: 'music streaming' },
      { label: 'Figma', href: 'https://www.figma.com', note: 'design and collaboration' },
      { label: 'Linear', href: 'https://linear.app', note: 'issue tracking' },
    ],
  },
  {
    title: 'Hardware',
    items: [
      { label: 'MacBook Pro M-series', note: 'primary machine' },
      { label: 'Synology DS220+ NAS' },
      { label: 'Razer Kiyo Pro' },
      {
        label: 'TickTime Cube',
        href: 'https://www.ticktime.store',
        note: 'pomodoro gadget',
      },
    ],
  },
  {
    title: 'Cloud',
    items: [
      {
        label: 'Google Drive',
        href: 'https://drive.google.com',
        note: 'day-to-day storage',
      },
      {
        label: 'Backblaze B2',
        href: 'https://www.backblaze.com/cloud-storage',
        note: 'off-site backups',
      },
      { label: 'Vercel', href: 'https://vercel.com', note: 'frontend cloud platform' },
      { label: 'GitHub', href: 'https://github.com', note: 'source control and review' },
    ],
  },
  {
    title: 'Philosophies',
    items: [
      {
        label: 'Shape Up',
        href: 'https://basecamp.com/shapeup',
        note: 'Basecamp product shaping and appetite-based planning',
      },
      {
        label: 'Getting Things Done (GTD)',
        href: 'https://gettingthingsdone.com/what-is-gtd/',
        note: 'trusted system for capture, clarify, and review',
      },
    ],
  },
];

export const usesGearPage = {
  title: 'Uses',
  handle: '@mortenbroesby',
  name: 'Morten Broesby-Olsen',
  profileHref: 'https://github.com/mortenbroesby',
  updatedOn: 'April 6, 2026',
  sections,
};
