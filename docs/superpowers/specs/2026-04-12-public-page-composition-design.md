# Public Page Composition Pattern

**Date:** 2026-04-12
**Status:** Approved
**Scope:** `apps/host` — public routes only

## Problem

Adding a new public page requires copying three pieces of boilerplate every time:

1. A fragment wrapper (`<>`)
2. A `<PageMetadata title description />` sibling
3. A `<PersonalPage testId="...">` container
4. Section divider classes (`border-t border-border/60 pt-6`) repeated across every `<section>`

This is error-prone — it is easy to forget metadata, use the wrong container name (`PersonalPage` vs the unused `PublicPage` alias), or write slightly inconsistent section dividers.

## Solution

Two new primitives that encode the full pattern:

### `PublicPage`

Replaces the current alias in `src/ui/primitives/public-page.tsx` with a real component that composes `PageMetadata` + `PersonalPage` internally.

```tsx
type PublicPageProps = {
  title: string;
  description: string;
  type?: 'website' | 'article';  // forwarded to PageMetadata; defaults to 'website'
  testId?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};
```

- `PersonalPage` remains the underlying layout primitive and is not changed.
- `PublicPageProps` is the new exported type; `PersonalPageProps` is no longer used directly in page files.

### `PageSection`

New primitive at `src/ui/primitives/page-section.tsx`.

```tsx
type PageSectionProps = {
  children: ReactNode;
  divided?: boolean;   // adds border-t border-border/60 pt-6
  className?: string;
  testId?: string;
};
```

- `divided` is false by default — first section in a page gets no divider.
- Subsequent sections pass `divided` to get the standard top border + padding.

## Usage

```tsx
export function AboutPage() {
  return (
    <PublicPage title="About" description="..." testId="about-page">
      <PageSection>
        <div className="space-y-4">...</div>
      </PageSection>
      <PageSection divided>
        <div className="space-y-3">...</div>
      </PageSection>
    </PublicPage>
  );
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/ui/primitives/public-page.tsx` | Replace alias with real `PublicPage` component |
| `src/ui/primitives/page-section.tsx` | New `PageSection` primitive |
| `src/application/pages/home-page.tsx` | Migrate to new pattern |
| `src/application/pages/about-page.tsx` | Migrate to new pattern |
| `src/application/pages/uses-page.tsx` | Migrate to new pattern |
| `src/application/pages/writing-page.tsx` | Migrate to new pattern |
| `src/application/pages/writing-post-page.tsx` | Migrate to new pattern (passes `type="article"`) |

## Out of Scope

- `PublicLayout` — not changed
- `PersonalPage` — stays as-is, used internally by `PublicPage`
- Playground routes — separate layout, not affected
- Route definitions — no changes
