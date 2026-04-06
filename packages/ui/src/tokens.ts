export type DesignSystemTokenGroup =
  | 'Typography'
  | 'Semantic Color'
  | 'Surface & Effects';

export type DesignSystemTokenPreview =
  | 'font'
  | 'hsl-color'
  | 'raw-color'
  | 'shadow'
  | 'radius';

export type DesignSystemToken = {
  name: string;
  value: string;
  group: DesignSystemTokenGroup;
  preview: DesignSystemTokenPreview;
  description: string;
};

export type DesignSystemUtility = {
  name: string;
  description: string;
};

export type DesignSystemComponent = {
  name: string;
  description: string;
  keywords: string[];
};

export const designSystemTokens: DesignSystemToken[] = [
  {
    name: '--font-sans',
    value: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    group: 'Typography',
    preview: 'font',
    description: 'Primary interface font stack.',
  },
  {
    name: '--font-mono',
    value: "'IBM Plex Mono', 'SFMono-Regular', 'SF Mono', ui-monospace, monospace",
    group: 'Typography',
    preview: 'font',
    description: 'Monospace stack for chrome, metrics, and terminal UI.',
  },
  {
    name: '--background',
    value: '210 31% 6%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Base page background color.',
  },
  {
    name: '--foreground',
    value: '152 20% 90%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Primary foreground text color.',
  },
  {
    name: '--card',
    value: '212 28% 9%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Card and panel background tone.',
  },
  {
    name: '--card-foreground',
    value: '152 20% 90%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Foreground color on card surfaces.',
  },
  {
    name: '--popover',
    value: '212 28% 9%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Popover and floating surface background.',
  },
  {
    name: '--popover-foreground',
    value: '152 20% 90%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Foreground color on popovers.',
  },
  {
    name: '--primary',
    value: '152 73% 56%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Primary action and success-adjacent accent.',
  },
  {
    name: '--primary-foreground',
    value: '210 31% 7%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Foreground on primary surfaces.',
  },
  {
    name: '--secondary',
    value: '214 22% 15%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Secondary interactive surface tone.',
  },
  {
    name: '--secondary-foreground',
    value: '152 18% 88%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Foreground on secondary surfaces.',
  },
  {
    name: '--muted',
    value: '215 19% 14%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Muted surface background.',
  },
  {
    name: '--muted-foreground',
    value: '212 13% 62%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Muted text and supporting chrome.',
  },
  {
    name: '--accent',
    value: '190 74% 57%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Secondary accent for status and emphasis.',
  },
  {
    name: '--accent-foreground',
    value: '210 31% 7%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Foreground on accent surfaces.',
  },
  {
    name: '--destructive',
    value: '0 72% 59%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Danger and destructive state color.',
  },
  {
    name: '--destructive-foreground',
    value: '0 0% 100%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Foreground on destructive surfaces.',
  },
  {
    name: '--border',
    value: '154 22% 22%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Default border and divider color.',
  },
  {
    name: '--input',
    value: '214 23% 13%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Input and control background tone.',
  },
  {
    name: '--ring',
    value: '152 73% 56%',
    group: 'Semantic Color',
    preview: 'hsl-color',
    description: 'Focus ring color.',
  },
  {
    name: '--radius',
    value: '0.4rem',
    group: 'Surface & Effects',
    preview: 'radius',
    description: 'Shared corner radius.',
  },
  {
    name: '--panel-shadow',
    value: '0 0 0 1px rgba(55, 74, 66, 0.24), 0 18px 50px rgba(0, 0, 0, 0.42)',
    group: 'Surface & Effects',
    preview: 'shadow',
    description: 'Default panel shadow stack.',
  },
  {
    name: '--panel-glow',
    value: '0 0 0 1px rgba(50, 255, 156, 0.08), 0 0 24px rgba(17, 94, 59, 0.16)',
    group: 'Surface & Effects',
    preview: 'shadow',
    description: 'Ambient glow for emphasized panels.',
  },
  {
    name: '--grid-line',
    value: 'rgba(74, 98, 90, 0.16)',
    group: 'Surface & Effects',
    preview: 'raw-color',
    description: 'Grid overlay line color.',
  },
  {
    name: '--surface-0',
    value: 'rgba(5, 11, 13, 0.96)',
    group: 'Surface & Effects',
    preview: 'raw-color',
    description: 'Deepest surface tone.',
  },
  {
    name: '--surface-1',
    value: 'rgba(8, 15, 18, 0.96)',
    group: 'Surface & Effects',
    preview: 'raw-color',
    description: 'Primary panel fill tone.',
  },
  {
    name: '--surface-2',
    value: 'rgba(11, 20, 23, 0.94)',
    group: 'Surface & Effects',
    preview: 'raw-color',
    description: 'Elevated panel fill tone.',
  },
  {
    name: '--surface-3',
    value: 'rgba(16, 29, 34, 0.9)',
    group: 'Surface & Effects',
    preview: 'raw-color',
    description: 'Brightest dark surface tone.',
  },
];

export const designSystemUtilities: DesignSystemUtility[] = [
  {
    name: '.terminal-app',
    description: 'Overall shell background container.',
  },
  {
    name: '.terminal-grid',
    description: 'Grid overlay treatment for panels and workspaces.',
  },
  {
    name: '.terminal-panel',
    description: 'Base framed surface.',
  },
  {
    name: '.terminal-panel--quiet',
    description: 'Subdued panel variant.',
  },
  {
    name: '.terminal-panel--glow',
    description: 'Emphasized panel with glow treatment.',
  },
  {
    name: '.chrome-label',
    description: 'Uppercase monospace micro label.',
  },
  {
    name: '.terminal-heading',
    description: 'Monospace heading treatment.',
  },
  {
    name: '.signal-badge',
    description: 'Inline badge shell.',
  },
  {
    name: '.signal-badge--primary',
    description: 'Primary badge tone.',
  },
  {
    name: '.signal-badge--accent',
    description: 'Accent badge tone.',
  },
  {
    name: '.signal-badge--danger',
    description: 'Danger badge tone.',
  },
  {
    name: '.signal-badge--muted',
    description: 'Muted badge tone.',
  },
  {
    name: '.status-led',
    description: 'Small status indicator dot.',
  },
  {
    name: '.status-led--live',
    description: 'Live/active LED tone.',
  },
  {
    name: '.status-led--accent',
    description: 'Accent LED tone.',
  },
  {
    name: '.status-led--danger',
    description: 'Danger LED tone.',
  },
  {
    name: '.terminal-button',
    description: 'Primary terminal button shell.',
  },
  {
    name: '.terminal-button--ghost',
    description: 'Secondary button variant.',
  },
  {
    name: '.terminal-button--danger',
    description: 'Destructive button variant.',
  },
  {
    name: '.terminal-input',
    description: 'Terminal-style text input.',
  },
  {
    name: '.metric-panel',
    description: 'Compact metric card surface.',
  },
  {
    name: '.metric-value',
    description: 'Metric value typography treatment.',
  },
  {
    name: '.log-panel',
    description: 'Monospace log container.',
  },
  {
    name: '.log-line',
    description: 'Single prefixed log row.',
  },
  {
    name: '.terminal-item',
    description: 'Reusable list/item surface.',
  },
  {
    name: '.terminal-rule',
    description: 'Decorative divider line.',
  },
  {
    name: '.terminal-scrollbars',
    description: 'Custom scrollbar treatment.',
  },
];

export const designSystemComponents: DesignSystemComponent[] = [
  {
    name: 'Button',
    description: 'Primary action control with secondary and danger variants.',
    keywords: ['action', 'cta', 'primary', 'secondary', 'danger'],
  },
  {
    name: 'Badge',
    description: 'Compact status label for state, tone, and metadata.',
    keywords: ['status', 'label', 'tone', 'primary', 'accent', 'muted', 'danger'],
  },
  {
    name: 'Input',
    description: 'Single-line text field styled for the terminal interface.',
    keywords: ['field', 'form', 'search', 'text'],
  },
  {
    name: 'Panel',
    description: 'Framed surface primitive for sections, asides, and workspaces.',
    keywords: ['surface', 'container', 'layout', 'glow', 'quiet', 'grid'],
  },
  {
    name: 'MetricCard',
    description: 'Compact numeric callout for stats, counts, and summary values.',
    keywords: ['stats', 'analytics', 'summary', 'kpi', 'number'],
  },
];
