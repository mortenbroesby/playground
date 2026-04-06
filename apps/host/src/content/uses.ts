export type UsesItem = {
  label: string;
  href?: string;
  note?: string;
};

export type UsesSection = {
  title: string;
  items: UsesItem[];
};

const sections: UsesSection[] = [
  {
    title: 'Coding',
    items: [
      { label: 'Editor: VSCode' },
      { label: 'Theme: Dark+' },
      { label: 'Oh My ZSH', href: 'https://ohmyz.sh', note: 'zsh shell setup' },
      { label: 'iTerm2', href: 'https://iterm2.com', note: 'terminal emulator' },
    ],
  },
  {
    title: 'VSCode extensions',
    items: [
      {
        label: 'Git Lens',
        href: 'https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens',
      },
      {
        label: 'Eslint',
        href: 'https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint',
      },
      {
        label: 'Peacock',
        href: 'https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock',
      },
      {
        label: 'Paste JSON as Code',
        href: 'https://marketplace.visualstudio.com/items?itemName=quicktype.quicktype',
      },
      {
        label: 'Code Spell Checker',
        href: 'https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker',
      },
      {
        label: 'Auto Rename Tag',
        href: 'https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag',
      },
      {
        label: 'Path Intellisense',
        href: 'https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense',
      },
      {
        label: 'MDX',
        href: 'https://marketplace.visualstudio.com/items?itemName=unifiedjs.vscode-mdx',
      },
      {
        label: 'Partial Diff',
        href: 'https://marketplace.visualstudio.com/items?itemName=ryu1kn.partial-diff',
      },
      {
        label: 'Live Share',
        href: 'https://marketplace.visualstudio.com/items?itemName=ms-vsliveshare.vsliveshare',
      },
      {
        label: 'Require To Import Syntax',
        href: 'https://marketplace.visualstudio.com/items?itemName=burkeholland.simple-react-snippets',
      },
      {
        label: 'TODO Highlight',
        href: 'https://marketplace.visualstudio.com/items?itemName=wayou.vscode-todo-highlight',
      },
      {
        label: 'TODO Tree',
        href: 'https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree',
      },
    ],
  },
  {
    title: 'Software',
    items: [
      { label: 'Chrome', note: 'daily driver browser' },
      { label: 'Flycut', href: 'https://github.com/TermiT/Flycut', note: 'clipboard manager' },
      {
        label: 'Kaleidoscope',
        href: 'https://kaleidoscope.app',
        note: 'merge conflict resolutions',
      },
      {
        label: 'SourceTree',
        href: 'https://www.sourcetreeapp.com',
        note: 'Git GUI',
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
      {
        label: 'ImageOptim',
        href: 'https://imageoptim.com',
        note: 'image optimization',
      },
      {
        label: 'BeardedSpice',
        href: 'https://beardedspice.github.io',
        note: 'controls Spotify, VLC, and more from media keys',
      },
      {
        label: 'Spedal Webcam',
        href: 'https://apps.apple.com/us/app/spedal-webcam-settings/id6449919671',
        note: 'adjust webcam settings',
      },
      {
        label: 'Alfred',
        href: 'https://www.alfredapp.com',
        note: 'Spotlight alternative',
      },
      {
        label: 'Spotify',
        href: 'https://www.spotify.com',
        note: 'music streaming',
      },
      {
        label: 'Notion',
        href: 'https://notion.so',
        note: 'notes and to-do lists',
      },
      { label: 'QuickTime', note: 'simple recordings or GIFs' },
    ],
  },
  {
    title: 'Tech',
    items: [
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
    title: 'Cloud services',
    items: [
      {
        label: 'Google Drive',
        href: 'https://drive.google.com',
        note: 'day-to-day storage',
      },
      {
        label: 'BackBlaze B2',
        href: 'https://www.backblaze.com',
        note: 'off-site backups',
      },
    ],
  },
  {
    title: 'Philosophies',
    items: [
      {
        label: 'Getting Things Done (GTD)',
        href: 'https://www.tameday.com',
      },
    ],
  },
  {
    title: 'Inspiration',
    items: [
      { label: 'Victor Nascimento', href: 'https://vnasc.dev' },
      { label: 'Raul Melo', href: 'https://www.raulmelo.dev' },
      { label: 'Jesper Rasmussen', href: 'https://jesperrasmussen.com' },
      { label: 'Erik Lubbers' },
      { label: 'Lee Robinson', href: 'https://leerob.io' },
      { label: 'Josh W Comeau', href: 'https://joshwcomeau.com' },
    ],
  },
];

export const usesPage = {
  title: 'Uses',
  handle: '@mortenbroesby',
  name: 'Morten Broesby-Olsen',
  profileHref: 'https://github.com/mortenbroesby',
  updatedOn: 'May 30, 2023',
  sections,
};
